import { readBuzzHistory } from '../buzzHistory';
import { describePlace } from '../location';
import { loadTagNames } from '../tagNames';
import { loadHistoryContext } from './historyContext';

/** Same local records, tag-name storage and place lookup as the existing buzz UI. */
export const getHistoryContext = () => loadHistoryContext({
  points: () => readBuzzHistory(50), names: loadTagNames, place: describePlace,
});
