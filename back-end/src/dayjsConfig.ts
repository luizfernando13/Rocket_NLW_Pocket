import dayjs from 'dayjs';
import utc from 'dayjs/plugin/utc';
import timezone from 'dayjs/plugin/timezone';
import isoWeek from 'dayjs/plugin/isoWeek';
import localeData from 'dayjs/plugin/localeData';
import localePtBr from 'dayjs/locale/pt-br';

dayjs.extend(utc);
dayjs.extend(timezone);
dayjs.extend(isoWeek);
dayjs.extend(localeData);

dayjs.tz.setDefault('America/Sao_Paulo');

dayjs.locale({
  ...localePtBr,
  weekStart: 1,
});

export default dayjs;