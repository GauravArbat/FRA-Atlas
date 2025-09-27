import React, { useEffect, useState } from 'react';
import { Box, Typography, Paper, Stack, FormControl, InputLabel, Select, MenuItem, Button, Divider, Chip } from '@mui/material';
import { api } from '../services/api';

const DecisionSupport: React.FC = () => {
  const [scheme, setScheme] = useState('PMKSY');
  const [state, setState] = useState('Maharashtra');
  const [district, setDistrict] = useState('Pune');
  const [eligibility, setEligibility] = useState<any>(null);
  const [priorities, setPriorities] = useState<any>(null);
  const [metrics, setMetrics] = useState<any>(null);

  const runEligibility = async () => {
    const res = await api.get('/fra/dss/eligibility', { params: { scheme, state, district } });
    setEligibility(res.data);
  };
  const runPrioritize = async () => {
    const res = await api.get('/fra/dss/prioritize', { params: { intervention: 'borewell', state, district } });
    setPriorities(res.data);
  };
  useEffect(() => {
    (async () => {
      const res = await api.get('/fra/dss/metrics');
      setMetrics(res.data);
    })();
  }, []);

  return (
    <Box>
      <Typography variant="h4" gutterBottom><span data-translate>Decision Support System</span></Typography>

      <Paper sx={{ p: 2, mb: 2 }}>
        <Stack direction={{ xs: 'column', md: 'row' }} spacing={2} alignItems="center">
          <FormControl size="small" sx={{ minWidth: 160 }}>
            <InputLabel><span data-translate>Scheme</span></InputLabel>
            <Select label="Scheme" value={scheme} onChange={(e) => setScheme(e.target.value)}>
              <MenuItem value="PMKSY"><span data-translate>PMKSY (Irrigation)</span></MenuItem>
              <MenuItem value="PMKISAN"><span data-translate>PM-KISAN</span></MenuItem>
              <MenuItem value="MGNREGA"><span data-translate>MGNREGA</span></MenuItem>
            </Select>
          </FormControl>
          <FormControl size="small" sx={{ minWidth: 160 }}>
            <InputLabel><span data-translate>State</span></InputLabel>
            <Select label="State" value={state} onChange={(e) => setState(e.target.value)}>
              <MenuItem value="Maharashtra"><span data-translate>Maharashtra</span></MenuItem>
              <MenuItem value="Chhattisgarh"><span data-translate>Chhattisgarh</span></MenuItem>
            </Select>
          </FormControl>
          <FormControl size="small" sx={{ minWidth: 160 }}>
            <InputLabel><span data-translate>District</span></InputLabel>
            <Select label="District" value={district} onChange={(e) => setDistrict(e.target.value)}>
              <MenuItem value="Pune"><span data-translate>Pune</span></MenuItem>
              <MenuItem value="Gadchiroli"><span data-translate>Gadchiroli</span></MenuItem>
            </Select>
          </FormControl>
          <Button variant="contained" onClick={runEligibility}><span data-translate>Evaluate Eligibility</span></Button>
          <Button variant="outlined" onClick={runPrioritize}><span data-translate>Prioritize Borewells</span></Button>
        </Stack>
      </Paper>

      {eligibility && (
        <Paper sx={{ p: 2, mb: 2 }}>
          <Typography variant="h6" gutterBottom><span data-translate>Eligibility Results – {eligibility.scheme}</span></Typography>
          <Divider sx={{ mb: 1 }} />
          <Stack direction="row" spacing={1} flexWrap="wrap">
            {eligibility.beneficiaries.map((b: any) => (
              <Chip key={b.id} label={`${b.name} • ${b.village} • ${Math.round(b.eligibilityScore*100)}%`} />
            ))}
          </Stack>
        </Paper>
      )}

      {priorities && (
        <Paper sx={{ p: 2, mb: 2 }}>
          <Typography variant="h6" gutterBottom><span data-translate>Intervention Priorities – {priorities.intervention}</span></Typography>
          <Divider sx={{ mb: 1 }} />
          <Stack direction="row" spacing={1} flexWrap="wrap">
            {priorities.recommendations.map((r: any, i: number) => (
              <Chip key={i} color={i===0?'success':i===1?'warning':'default'} label={`${r.block} • Priority ${Math.round(r.priorityScore*100)} • GWI ${r.groundwaterIndex}`} />
            ))}
          </Stack>
        </Paper>
      )}

      {metrics && (
        <Paper sx={{ p: 2 }}>
          <Typography variant="h6" gutterBottom><span data-translate>Policy Dashboard</span></Typography>
          <Divider sx={{ mb: 1 }} />
          <Typography variant="body2">National: {metrics.national.beneficiaries.toLocaleString()} beneficiaries • {metrics.national.coveragePct}% coverage • {metrics.national.fundedProjects.toLocaleString()} projects</Typography>
          <Divider sx={{ my: 1 }} />
          <Stack direction="row" spacing={1} flexWrap="wrap">
            {metrics.states.map((s: any) => (
              <Chip key={s.name} label={`${s.name}: ${s.beneficiaries.toLocaleString()} • ${s.coveragePct}%`} />
            ))}
          </Stack>
        </Paper>
      )}
    </Box>
  );
};

export default DecisionSupport;



