import { useEffect, useState } from 'react';

const API_BASE =
  'https://customer-rest-service-frontend-personaltrainer.2.rahtiapp.fi/api';

export default function useTrainerData() {
  const [state, setState] = useState({
    customers: [],
    trainings: [],
    loading: true,
    error: '',
  });

  async function loadData(signal) {
    setState((current) => ({
      ...current,
      loading: true,
      error: '',
    }));

    try {
      const [customerResponse, trainingResponse] = await Promise.all([
        fetch(`${API_BASE}/customers`, { signal }),
        fetch(`${API_BASE}/gettrainings`, { signal }),
      ]);

      if (!customerResponse.ok || !trainingResponse.ok) {
        throw new Error('Could not load data from the API.');
      }

      const customerPayload = await customerResponse.json();
      const trainingPayload = await trainingResponse.json();

      setState({
        customers: customerPayload._embedded?.customers ?? [],
        trainings: Array.isArray(trainingPayload) ? trainingPayload : [],
        loading: false,
        error: '',
      });
    } catch (error) {
      if (error.name === 'AbortError') {
        return;
      }

      setState((current) => ({
        ...current,
        loading: false,
        error: error.message || 'Could not load data from the API.',
      }));
    }
  }

  useEffect(() => {
    const controller = new AbortController();
    loadData(controller.signal);

    return () => controller.abort();
  }, []);

  return {
    ...state,
    refresh: () => loadData(),
  };
}
