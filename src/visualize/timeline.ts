import TimelinesChart from 'timelines-chart';

const width = 1200;
const height = 640;

const data = require('../process/timeline.data.json');

export function mount() {
  document.getElementById('root').innerHTML = '';
  TimelinesChart()
  .width(width)
  .maxHeight(height)
  .rightMargin(360)
  .zQualitative(true)
  .data(data)(document.getElementById('root'));
}