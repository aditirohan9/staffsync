import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import api from '../api/axios';

const readUser = () => {
  try {
    return JSON.parse(localStorage.getItem('user'));
  } catch {
    return null;
  }
};

const persist = ({ token, user }) => {
  localStorage.setItem('token', token);
  localStorage.setItem('user', JSON.stringify(user));
};

const errMsg = (err) => err.response?.data?.message || err.message || 'Something went wrong';

export const loginUser = createAsyncThunk('auth/login', async (credentials, { rejectWithValue }) => {
  try {
    const { data } = await api.post('/auth/login', credentials);
    persist(data);
    return data;
  } catch (err) {
    return rejectWithValue(errMsg(err));
  }
});

export const registerUser = createAsyncThunk('auth/register', async (form, { rejectWithValue }) => {
  try {
    const { data } = await api.post('/auth/register', form);
    persist(data);
    return data;
  } catch (err) {
    return rejectWithValue(errMsg(err));
  }
});

const authSlice = createSlice({
  name: 'auth',
  initialState: {
    user: readUser(),
    token: localStorage.getItem('token'),
    status: 'idle', // idle | loading | failed
    error: null,
  },
  reducers: {
    logout(state) {
      state.user = null;
      state.token = null;
      state.status = 'idle';
      state.error = null;
      localStorage.removeItem('token');
      localStorage.removeItem('user');
    },
    clearError(state) {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addMatcher(
        (a) => a.type.startsWith('auth/') && a.type.endsWith('/pending'),
        (state) => {
          state.status = 'loading';
          state.error = null;
        }
      )
      .addMatcher(
        (a) => a.type.startsWith('auth/') && a.type.endsWith('/fulfilled'),
        (state, action) => {
          state.status = 'idle';
          state.user = action.payload.user;
          state.token = action.payload.token;
        }
      )
      .addMatcher(
        (a) => a.type.startsWith('auth/') && a.type.endsWith('/rejected'),
        (state, action) => {
          state.status = 'failed';
          state.error = action.payload || 'Request failed';
        }
      );
  },
});

export const { logout, clearError } = authSlice.actions;
export default authSlice.reducer;
