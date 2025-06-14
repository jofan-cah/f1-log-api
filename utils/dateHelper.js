  
const moment = require('moment');

// Set default timezone ke Indonesia
moment.locale('id');
const timezone = 'Asia/Jakarta';

// Format date ke berbagai format Indonesia
const formatDate = (date, format = 'DD MMMM YYYY') => {
  if (!date) return null;
  return moment(date).tz(timezone).format(format);
};

// Format datetime
const formatDateTime = (date, format = 'DD MMMM YYYY HH:mm:ss') => {
  if (!date) return null;
  return moment(date).tz(timezone).format(format);
};

// Format date untuk database (YYYY-MM-DD)
const formatDateForDB = (date) => {
  if (!date) return null;
  return moment(date).format('YYYY-MM-DD');
};

// Format datetime untuk database (YYYY-MM-DD HH:mm:ss)
const formatDateTimeForDB = (date) => {
  if (!date) return null;
  return moment(date).format('YYYY-MM-DD HH:mm:ss');
};

// Parse date string ke moment object
const parseDate = (dateString, format = null) => {
  if (!dateString) return null;
  
  if (format) {
    return moment(dateString, format).tz(timezone);
  }
  
  return moment(dateString).tz(timezone);
};

// Get current date/time dalam timezone Indonesia
const now = () => {
  return moment().tz(timezone);
};

// Get today date (start of day)
const today = () => {
  return moment().tz(timezone).startOf('day');
};

// Get tomorrow date
const tomorrow = () => {
  return moment().tz(timezone).add(1, 'day').startOf('day');
};

// Get yesterday date
const yesterday = () => {
  return moment().tz(timezone).subtract(1, 'day').startOf('day');
};

// Calculate age dari tanggal lahir
const calculateAge = (birthDate) => {
  if (!birthDate) return null;
  return moment().diff(moment(birthDate), 'years');
};

// Calculate difference between two dates
const dateDiff = (date1, date2, unit = 'days') => {
  if (!date1 || !date2) return null;
  return moment(date1).diff(moment(date2), unit);
};

// Add time to date
const addTime = (date, amount, unit = 'days') => {
  if (!date) return null;
  return moment(date).add(amount, unit);
};

// Subtract time from date
const subtractTime = (date, amount, unit = 'days') => {
  if (!date) return null;
  return moment(date).subtract(amount, unit);
};

// Check if date is valid
const isValidDate = (date) => {
  return moment(date).isValid();
};

// Check if date is today
const isToday = (date) => {
  if (!date) return false;
  return moment(date).tz(timezone).isSame(today(), 'day');
};

// Check if date is in the past
const isPast = (date) => {
  if (!date) return false;
  return moment(date).tz(timezone).isBefore(now());
};

// Check if date is in the future
const isFuture = (date) => {
  if (!date) return false;
  return moment(date).tz(timezone).isAfter(now());
};

// Get start of week (Monday)
const startOfWeek = (date = null) => {
  const targetDate = date ? moment(date) : moment();
  return targetDate.tz(timezone).startOf('isoWeek');
};

// Get end of week (Sunday)
const endOfWeek = (date = null) => {
  const targetDate = date ? moment(date) : moment();
  return targetDate.tz(timezone).endOf('isoWeek');
};

// Get start of month
const startOfMonth = (date = null) => {
  const targetDate = date ? moment(date) : moment();
  return targetDate.tz(timezone).startOf('month');
};

// Get end of month
const endOfMonth = (date = null) => {
  const targetDate = date ? moment(date) : moment();
  return targetDate.tz(timezone).endOf('month');
};

// Get start of year
const startOfYear = (date = null) => {
  const targetDate = date ? moment(date) : moment();
  return targetDate.tz(timezone).startOf('year');
};

// Get end of year
const endOfYear = (date = null) => {
  const targetDate = date ? moment(date) : moment();
  return targetDate.tz(timezone).endOf('year');
};

// Get date range untuk query database
const getDateRange = (period) => {
  const endDate = now().endOf('day');
  let startDate;

  switch (period) {
    case 'today':
      startDate = today();
      break;
    case 'yesterday':
      startDate = yesterday();
      endDate = yesterday().endOf('day');
      break;
    case 'this_week':
      startDate = startOfWeek();
      break;
    case 'last_week':
      startDate = startOfWeek().subtract(1, 'week');
      endDate = endOfWeek().subtract(1, 'week');
      break;
    case 'this_month':
      startDate = startOfMonth();
      break;
    case 'last_month':
      startDate = startOfMonth().subtract(1, 'month');
      endDate = endOfMonth().subtract(1, 'month');
      break;
    case 'this_year':
      startDate = startOfYear();
      break;
    case 'last_year':
      startDate = startOfYear().subtract(1, 'year');
      endDate = endOfYear().subtract(1, 'year');
      break;
    case 'last_30_days':
      startDate = now().subtract(30, 'days').startOf('day');
      break;
    case 'last_90_days':
      startDate = now().subtract(90, 'days').startOf('day');
      break;
    default:
      startDate = today();
  }

  return {
    start: startDate.toDate(),
    end: endDate.toDate(),
    startFormatted: formatDateTimeForDB(startDate),
    endFormatted: formatDateTimeForDB(endDate)
  };
};

// Generate array of dates antara dua tanggal
const getDatesBetween = (startDate, endDate) => {
  if (!startDate || !endDate) return [];
  
  const dates = [];
  const current = moment(startDate);
  const end = moment(endDate);
  
  while (current.isSameOrBefore(end, 'day')) {
    dates.push(current.format('YYYY-MM-DD'));
    current.add(1, 'day');
  }
  
  return dates;
};

// Format duration (in minutes) ke human readable
const formatDuration = (minutes) => {
  if (!minutes || minutes < 0) return '0 menit';
  
  const duration = moment.duration(minutes, 'minutes');
  const days = duration.days();
  const hours = duration.hours();
  const mins = duration.minutes();
  
  const parts = [];
  
  if (days > 0) parts.push(`${days} hari`);
  if (hours > 0) parts.push(`${hours} jam`);
  if (mins > 0) parts.push(`${mins} menit`);
  
  return parts.length > 0 ? parts.join(' ') : '0 menit';
};

// Get relative time (misalnya: "2 jam yang lalu")
const getRelativeTime = (date) => {
  if (!date) return null;
  return moment(date).tz(timezone).fromNow();
};

// Check if date is weekend
const isWeekend = (date = null) => {
  const targetDate = date ? moment(date) : moment();
  const dayOfWeek = targetDate.tz(timezone).day();
  return dayOfWeek === 0 || dayOfWeek === 6; // Sunday = 0, Saturday = 6
};

// Get business days between two dates (exclude weekends)
const getBusinessDaysBetween = (startDate, endDate) => {
  if (!startDate || !endDate) return 0;
  
  let count = 0;
  const current = moment(startDate);
  const end = moment(endDate);
  
  while (current.isSameOrBefore(end, 'day')) {
    if (!isWeekend(current)) {
      count++;
    }
    current.add(1, 'day');
  }
  
  return count;
};

// Format date untuk display sesuai konteks
const formatForContext = (date, context = 'default') => {
  if (!date) return null;
  
  const momentDate = moment(date).tz(timezone);
  
  switch (context) {
    case 'short':
      return momentDate.format('DD/MM/YY');
    case 'medium':
      return momentDate.format('DD MMM YYYY');
    case 'long':
      return momentDate.format('dddd, DD MMMM YYYY');
    case 'time':
      return momentDate.format('HH:mm');
    case 'datetime':
      return momentDate.format('DD/MM/YY HH:mm');
    case 'full':
      return momentDate.format('dddd, DD MMMM YYYY HH:mm:ss');
    case 'iso':
      return momentDate.toISOString();
    default:
      return momentDate.format('DD MMMM YYYY');
  }
};

// Parse berbagai format tanggal Indonesia
const parseIndonesianDate = (dateString) => {
  if (!dateString) return null;
  
  const formats = [
    'DD/MM/YYYY',
    'DD-MM-YYYY',
    'DD MMMM YYYY',
    'DD MMM YYYY',
    'YYYY-MM-DD',
    'DD/MM/YY',
    'DD-MM-YY'
  ];
  
  for (const format of formats) {
    const parsed = moment(dateString, format, true);
    if (parsed.isValid()) {
      return parsed.tz(timezone);
    }
  }
  
  // Try default parsing
  const defaultParsed = moment(dateString);
  return defaultParsed.isValid() ? defaultParsed.tz(timezone) : null;
};

module.exports = {
  formatDate,
  formatDateTime,
  formatDateForDB,
  formatDateTimeForDB,
  parseDate,
  parseIndonesianDate,
  now,
  today,
  tomorrow,
  yesterday,
  calculateAge,
  dateDiff,
  addTime,
  subtractTime,
  isValidDate,
  isToday,
  isPast,
  isFuture,
  isWeekend,
  startOfWeek,
  endOfWeek,
  startOfMonth,
  endOfMonth,
  startOfYear,
  endOfYear,
  getDateRange,
  getDatesBetween,
  getBusinessDaysBetween,
  formatDuration,
  getRelativeTime,
  formatForContext,
  timezone
};