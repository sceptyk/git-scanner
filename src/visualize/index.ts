import { mount as mountTimeline } from './timeline';
import { mount as mountTreemap } from './treemap';

mountTimeline();

document.getElementById('button_timeline').addEventListener('click', mountTimeline);
document.getElementById('button_treemap').addEventListener('click', mountTreemap);