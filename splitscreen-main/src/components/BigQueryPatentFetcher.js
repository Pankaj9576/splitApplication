import axios from 'axios';

class BigQueryPatentFetcher {
  async fetchPatentData(patentNumber) {
    try {
      console.log(`Fetching patent data for ${patentNumber} from http://localhost:3001/api/fetch-patent`);
      const response = await axios.post('http://localhost:3001/api/fetch-patent', { patentNumber }, {
        headers: { 'Content-Type': 'application/json' },
      });
      if (!response.data || Object.keys(response.data).length === 0) {
        throw new Error('No patent data returned');
      }
      console.log('Patent data fetched successfully:', response.data);
      return response.data;
    } catch (error) {
      console.error('Error fetching patent data:', {
        message: error.message,
        response: error.response ? error.response.data : 'No response',
      });
      throw new Error(error.response?.data?.message || 'Failed to fetch patent data');
    }
  }
}

export default BigQueryPatentFetcher;