import { useState, useEffect } from 'react';
import api from '../../api';

export default function useCertificateData() {
  const [memberData, setMemberData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    let cancelled = false;

    const fetchData = async () => {
      setLoading(true);
      setError(null);
      try {
        const token = localStorage.getItem('token');
        const res = await api.get('certificates/my-data', {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (!cancelled) setMemberData(res.data);
      } catch (err) {
        if (cancelled) return;
        if (err.response?.status === 403) {
          setError('Certificate not available. Your membership is pending approval.');
        } else if (err.response?.status === 404) {
          setError('Member data not found. Contact admin.');
        } else {
          setError('Failed to load certificate data.');
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    fetchData();
    return () => { cancelled = true; };
  }, []);

  return { memberData, loading, error };
}
