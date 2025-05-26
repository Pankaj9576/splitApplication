import React, { useState, useEffect, useRef } from 'react';
import * as XLSX from 'xlsx';
import Papa from 'papaparse';

const ProxyContent = ({ url }) => {
  const [content, setContent] = useState(null);
  const [error, setError] = useState(null);
  const [tableData, setTableData] = useState({ html: null, activeSheet: null });
  const [htmlContent, setHtmlContent] = useState(null);
  const contentRef = useRef(null);

  const fetchContent = async () => {
    if (!url) {
      setError('No URL or link provided');
      return;
    }
    console.log('Fetching content for URL:', url);
    setContent(null);
    setTableData({ html: null, activeSheet: null });
    setHtmlContent(null);
    setError(null);

    try {
      let response;
      if (url.startsWith('blob:')) {
        console.log('Attempting to fetch blob URL:', url);
        response = await fetch(url, { mode: 'cors' });
        if (!response.ok) throw new Error(`Blob fetch failed: ${response.status} - ${response.statusText}`);
        const blob = await response.blob();
        console.log('Blob fetched successfully, type:', blob.type);
        await handleContentType(blob.type, blob);
      } else {
        const proxyUrl = `http://localhost:5001/proxy?url=${encodeURIComponent(url)}`;
        console.log('Attempting to fetch proxy URL:', proxyUrl);
        response = await fetch(proxyUrl, { method: 'GET' });
        if (!response.ok) throw new Error(`Proxy fetch failed: ${response.status} - ${response.statusText}`);
        console.log('Proxy response received, status:', response.status);
        const contentType = response.headers.get('content-type') || 'application/octet-stream';
        const blob = await response.blob();
        await handleContentType(contentType, blob);
      }
    } catch (err) {
      console.error('Fetch error:', err);
      setError(`Failed to load content: ${err.message}. Ensure the proxy server is running at http://localhost:5001.`);
      if (url.startsWith('blob:')) {
        try {
          const blob = await fetch(url, { mode: 'cors' }).then((res) => res.blob());
          setContent({ type: 'download', url: URL.createObjectURL(blob) });
        } catch (blobErr) {
          console.error('Blob fallback error:', blobErr);
        }
      } else if (url.startsWith('http')) {
        try {
          const blob = await fetch(url, { mode: 'no-cors' }).then((res) => res.blob());
          setContent({ type: 'download', url: URL.createObjectURL(blob) });
        } catch (httpErr) {
          console.error('HTTP fallback error:', httpErr);
        }
      }
    }
  };

  const handleContentType = async (contentType, blob) => {
    const url = URL.createObjectURL(blob);
    console.log('Handling content type:', contentType, 'for URL:', url);
    if (contentType.includes('application/pdf')) {
      setContent({ type: 'pdf', url });
    } else if (contentType.includes('image/')) {
      setContent({ type: 'image', url });
    } else if (
      contentType.includes('application/vnd.openxmlformats-officedocument.spreadsheetml.sheet') ||
      contentType.includes('application/vnd.ms-excel')
    ) {
      const arrayBuffer = await blob.arrayBuffer();
      const workbook = XLSX.read(arrayBuffer, { type: 'array', cellStyles: true });
      const sheets = {};
      workbook.SheetNames.forEach((sheetName) => {
        const worksheet = workbook.Sheets[sheetName];
        // Generate HTML with merge information
        const html = XLSX.utils.sheet_to_html(worksheet, {
          editable: false,
          id: `sheet-${sheetName.replace(/[^a-zA-Z0-9]/g, '_')}`,
        });
        sheets[sheetName] = html;
      });
      if (Object.keys(sheets).length === 0) throw new Error('No valid sheets found in the Excel file');
      console.log('Sheets parsed:', Object.keys(sheets));
      setTableData({ html: sheets, activeSheet: Object.keys(sheets)[0] });
    } else if (contentType.includes('text/csv')) {
      const text = await blob.text();
      const result = Papa.parse(text, { header: false, skipEmptyLines: false });
      if (result.data && result.data.length) {
        const columns = result.data[0].map((header, index) => ({
          key: index.toString(),
          name: header?.toString() || `Column ${index + 1}`,
        }));
        const rows = result.data.slice(1).map((row, rowIndex) =>
          columns.reduce((obj, col, colIndex) => {
            obj[col.key] = row[colIndex]?.toString() || '';
            return obj;
          }, {})
        );
        const html = `
          <table border="1">
            <thead><tr>${columns.map(col => `<th>${col.name}</th>`).join('')}</tr></thead>
            <tbody>${rows.map(row => `<tr>${columns.map(col => `<td>${row[col.key]}</td>`).join('')}</tr>`).join('')}</tbody>
          </table>
        `;
        setTableData({ html: { 'Sheet1': html }, activeSheet: 'Sheet1' });
      } else {
        throw new Error('No data found in the CSV file');
      }
    } else if (
      contentType.includes('application/msword') ||
      contentType.includes('application/vnd.openxmlformats-officedocument.wordprocessingml.document') ||
      contentType.includes('text/html')
    ) {
      const text = await blob.text();
      setHtmlContent(text);
    } else if (
      contentType.includes('application/vnd.ms-powerpoint') ||
      contentType.includes('application/vnd.openxmlformats-officedocument.presentationml.presentation')
    ) {
      setContent({ type: 'download', url, message: 'PPT/PPTX files cannot be rendered directly. Please download to view.' });
    } else {
      setContent({ type: 'download', url, message: 'This file type is not directly renderable. Please download to view.' });
    }
  };

  const handleSheetChange = (e) => {
    setTableData((prev) => ({ ...prev, activeSheet: e.target.value }));
  };

  useEffect(() => {
    fetchContent();
  }, [url]);

  useEffect(() => {
    const handleClick = (e) => {
      const link = e.target.closest('a');
      if (link && link.href) {
        e.preventDefault();
        const newUrl = link.href;
        console.log('Link clicked in ProxyContent:', newUrl);
        window.parent.postMessage({ type: 'linkClick', url: newUrl }, '*');
      }
    };

    const contentElement = contentRef.current;
    if (contentElement && (tableData.html || htmlContent)) {
      contentElement.addEventListener('click', handleClick);
    }
    return () => {
      if (contentElement && (tableData.html || htmlContent)) {
        contentElement.removeEventListener('click', handleClick);
      }
    };
  }, [tableData.html, htmlContent]);

  if (error) {
    return (
      <div
        style={{
          color: '#ff4d4f',
          padding: 12,
          background: '#ffe6e6',
          borderRadius: 8,
          textAlign: 'center',
          fontSize: 16,
        }}
      >
        {error}
        {content?.type === 'download' && (
          <a href={content.url} download style={{ marginLeft: 10, color: '#1a73e8', textDecoration: 'none' }}>
            Download File
          </a>
        )}
        <button onClick={fetchContent} style={{ marginLeft: 10, padding: '5px 10px' }}>
          Reload
        </button>
      </div>
    );
  }

  if (!content && !tableData.html && !htmlContent) {
    return <div style={{ color: '#666', padding: 12, textAlign: 'center', fontSize: 16 }}>Loading content, please wait...</div>;
  }

  if (tableData.html) {
    return (
      <div
        style={{
          height: '100%',
          width: '100%',
          border: '1px solid #ddd',
          background: '#fff',
          overflow: 'hidden',
          display: 'flex',
          flexDirection: 'column',
        }}
      >
        <div
          style={{
            padding: '10px',
            textAlign: 'center',
            background: '#f5f5f5',
            borderBottom: '1px solid #ddd',
            flexShrink: 0,
          }}
        >
          <select
            value={tableData.activeSheet}
            onChange={handleSheetChange}
            style={{
              padding: '5px',
              fontSize: '14px',
              border: '1px solid #ccc',
              borderRadius: '4px',
            }}
          >
            {Object.keys(tableData.html).map((sheetName) => (
              <option key={sheetName} value={sheetName}>
                {sheetName}
              </option>
            ))}
          </select>
        </div>
        <div style={{ flex: 1, overflow: 'auto' }}>
          <div
            ref={contentRef}
            style={{
              padding: 10,
              overflow: 'hidden',
            }}
            dangerouslySetInnerHTML={{
              __html: `
                <style>
                  #sheet-${tableData.activeSheet.replace(/[^a-zA-Z0-9]/g, '_')} table {
                    border-collapse: collapse;
                    width: 100%;
                    font-family: Arial, sans-serif;
                  }
                  #sheet-${tableData.activeSheet.replace(/[^a-zA-Z0-9]/g, '_')} th,
                  #sheet-${tableData.activeSheet.replace(/[^a-zA-Z0-9]/g, '_')} td {
                    border: 1px solid #000;
                    padding: 8px;
                    text-align: left;
                    white-space: normal;
                    overflow-wrap: break-word;
                    min-width: 100px;
                    max-width: 600px; /* Adjusted for wider cells in Search Strings */
                  }
                  #sheet-${tableData.activeSheet.replace(/[^a-zA-Z0-9]/g, '_')} th {
                    background-color: #4a90e2;
                    color: #fff;
                    font-weight: bold;
                    position: sticky;
                    top: 0;
                    z-index: 1;
                  }
                  #sheet-${tableData.activeSheet.replace(/[^a-zA-Z0-9]/g, '_')} tr:nth-child(even) {
                    background-color: #f9f9f9;
                  }
                  #sheet-${tableData.activeSheet.replace(/[^a-zA-Z0-9]/g, '_')} td[colspan] {
                    background-color: #fff;
                    font-weight: bold;
                    font-size: 14px;
                    line-height: 1.5;
                  }
                </style>
                ${tableData.html[tableData.activeSheet]}
              `,
            }}
          />
        </div>
      </div>
    );
  }

  if (htmlContent) {
    return (
      <div
        ref={contentRef}
        style={{ padding: 20, overflow: 'auto', maxHeight: '100%' }}
        dangerouslySetInnerHTML={{ __html: htmlContent }}
      />
    );
  }

  if (content?.type === 'pdf') {
    return <embed src={content.url} type="application/pdf" width="100%" height="100%" />;
  }
  if (content?.type === 'image') {
    return <img src={content.url} alt="Uploaded" style={{ maxWidth: '100%', maxHeight: '100%' }} />;
  }
  if (content?.type === 'download') {
    return (
      <div style={{ textAlign: 'center', padding: 20 }}>
        <p style={{ color: '#666', marginBottom: 10 }}>{content.message || 'This file type is not directly renderable. Please download to view.'}</p>
        <a href={content.url} download style={{ color: '#1a73e8', textDecoration: 'none' }}>
          Download File
        </a>
      </div>
    );
  }

  return null;
};

export default ProxyContent;