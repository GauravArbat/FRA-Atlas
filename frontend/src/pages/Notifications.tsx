import React from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { Box, Typography, Paper, List, ListItem, ListItemText, ListItemIcon, Chip, IconButton, Stack } from '@mui/material';
import { CheckCircle, Error as ErrorIcon, Info, Warning, Delete } from '@mui/icons-material';
import { RootState } from '../store';
import { removeNotification } from '../store/slices/uiSlice';

const typeToIcon: Record<string, React.ReactNode> = {
  success: <CheckCircle color="success" />,
  error: <ErrorIcon color="error" />,
  warning: <Warning color="warning" />,
  info: <Info color="info" />,
};

const Notifications: React.FC = () => {
  const dispatch = useDispatch();
  const notifications = useSelector((state: RootState) => state.ui.notifications);

  return (
    <Box>
      <Typography variant="h4" gutterBottom>
        Notifications
      </Typography>

      <Paper sx={{ p: 2 }}>
        {notifications.length === 0 ? (
          <Typography color="text.secondary">You're all caught up. No notifications.</Typography>
        ) : (
          <List>
            {notifications.map((n) => (
              <ListItem
                key={n.id}
                secondaryAction={
                  <IconButton edge="end" aria-label="delete" onClick={() => dispatch(removeNotification(n.id))}>
                    <Delete />
                  </IconButton>
                }
              >
                <ListItemIcon>{typeToIcon[n.type]}</ListItemIcon>
                <ListItemText
                  primary={
                    <Stack direction="row" spacing={1} alignItems="center">
                      <Typography>{n.message}</Typography>
                      <Chip size="small" variant="outlined" label={n.type} />
                    </Stack>
                  }
                  secondary={new Date(n.timestamp).toLocaleString()}
                />
              </ListItem>
            ))}
          </List>
        )}
      </Paper>
    </Box>
  );
};

export default Notifications;


