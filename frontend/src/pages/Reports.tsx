import React, { useEffect, useState } from 'react';
import { Box, Typography, Paper, Stack, Divider } from '@mui/material';
import { api } from '../services/api';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar, PieChart, Pie, Cell, Legend } from 'recharts';

const Reports: React.FC = () => {
  const [data, setData] = useState<any>(null);

  useEffect(() => {
    (async () => {
      const res = await api.get('/fra/reports/summary');
      setData(res.data);
    })();
  }, []);

  if (!data) return <Typography>Loading...</Typography>;

  const COLORS = ['#2e7d32', '#ff9800', '#1976d2'];

  return (
    <Box>
      <Typography variant="h4" gutterBottom>Reports & Analytics</Typography>

      <Stack spacing={3}>
        <Paper sx={{ p: 2 }}>
          <Typography variant="h6">Beneficiaries Over Time</Typography>
          <Divider sx={{ mb: 1 }} />
          <ResponsiveContainer width="100%" height={280}>
            <LineChart data={data.timeseries}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="month" />
              <YAxis />
              <Tooltip />
              <Line type="monotone" dataKey="beneficiaries" stroke="#2e7d32" strokeWidth={2} />
            </LineChart>
          </ResponsiveContainer>
        </Paper>

        <Stack direction={{ xs: 'column', md: 'row' }} spacing={3}>
          <Paper sx={{ p: 2, flex: 1 }}>
            <Typography variant="h6">By Type</Typography>
            <Divider sx={{ mb: 1 }} />
            <ResponsiveContainer width="100%" height={260}>
              <PieChart>
                <Pie dataKey="value" data={data.byType} nameKey="type" cx="50%" cy="50%" outerRadius={80} label>
                  {data.byType.map((_: any, idx: number) => (
                    <Cell key={idx} fill={COLORS[idx % COLORS.length]} />
                  ))}
                </Pie>
                <Legend />
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </Paper>

          <Paper sx={{ p: 2, flex: 1 }}>
            <Typography variant="h6">Top Districts</Typography>
            <Divider sx={{ mb: 1 }} />
            <ResponsiveContainer width="100%" height={260}>
              <BarChart data={data.topDistricts}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="beneficiaries" fill="#1976d2" />
              </BarChart>
            </ResponsiveContainer>
          </Paper>
        </Stack>
      </Stack>
    </Box>
  );
};

export default Reports;



