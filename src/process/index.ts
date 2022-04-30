import simpleGit from 'simple-git';
import groupBy from 'lodash/groupBy';
import orderBy from 'lodash/orderBy';
import dayjs from 'dayjs';

import fs from 'fs';
import path from 'path';
const config = require('./config.json');

const git = simpleGit({ baseDir: config.repoDir });

interface DataNode {
  name: string;
  children: DataNode[];
  value?: number;
}

interface TimelineNode {
  label: string;
  data: {
    timeRange: [Date, Date];
    val: string;
  }[];
}

interface FileChange {
  date: string,
  ticket: string;
  file: string;
}

(async function() {
  const logs = await git.log([`--after={${config.afterDate}}`, '--stat=10000']);

  const regex = new RegExp(config.regex);
  const fileChanges: FileChange[] = logs.all
    .filter(commit => commit.diff?.files?.length && commit.message.match(regex))
    .flatMap(commit => {
      const ticket = (commit.message.match(regex) as any)[0];
      return (commit.diff?.files || []).map(change => ({
        date: commit.date,
        ticket,
        file: change.file,
      }))
    })

  let rankedChanges = Object.values(groupBy(fileChanges, 'file')).map(byFile => {

    const uniqueTickets = new Set(byFile.map(({ ticket }) => ticket));

    const times = Object.values(groupBy(byFile, 'ticket')).map(byTicket => {

      const dates = byTicket.map(({ date }) => dayjs(date).toDate().getTime());
      const minDate = Math.min(...dates);
      const maxDate = Math.max(...dates);

      return {
        ticket: byTicket[0].ticket,
        start: minDate,
        end: maxDate
      }
    })

    return {
      ticket: [...uniqueTickets],
      times,
      file: byFile[0].file,
      value: uniqueTickets.size
    }
  })

  if (config.ignore?.length) {
    rankedChanges = rankedChanges.filter(({ file }) => config.ignore.every((pathPart: string) => !file.includes(pathPart)));
  }

  rankedChanges = orderBy(rankedChanges, 'value', 'desc');

  if (config.includeTop) {
    rankedChanges = rankedChanges.slice(0, config.includeTop);
  }

  // prepare summary.data.json for human readable summary
  const summary = rankedChanges.map(change => ({
    ...(config.hideTickets ? {} : { ticket: change.ticket }),
    file: change.file,
    value: change.value,
  }))
  fs.writeFileSync(path.join(__dirname, './summary.data.json'), JSON.stringify(summary, null, 2));

  // prepare treemap.data.json for treemap chart
  const tree: DataNode = {
    name: config.repoDir,
    children: [],
  };
  rankedChanges.forEach(fileChange => {
    const pathParts = fileChange.file.split('/');

    let current = tree;
    pathParts.forEach(part => {
      let partNode = current.children.find(({ name }) => name === part);
      if (!partNode) {
        partNode = { name: part, children: [] };
        current.children.push(partNode);
      }
      current = partNode;
    })

    current.value = fileChange.value;
  });
  fs.writeFileSync(path.join(__dirname, './treemap.data.json'), JSON.stringify(tree, null, 2));

  // prepare timeline.data.js for timeline chart
  const timelineData: TimelineNode[] = [];
  rankedChanges.forEach(fileChange => {
    const pathParts = fileChange.file.split('/');

    const addTimelineNode = (path: string) => {
      const timelinePartIndex = timelineData.findIndex(t => t.label === path);
      const label = pathParts[pathParts.length - 1]
      let timelinePart: TimelineNode = { label, data: [] };
      if (timelinePartIndex >= 0) {
        timelinePart = timelineData[timelinePartIndex];
      }
      timelinePart.data.push(...fileChange.times.map(t => ({
        timeRange: [new Date(t.start), new Date(t.end)] as [Date, Date],
        val: t.ticket
      })));
      if (timelinePartIndex >= 0) {
        timelineData[timelinePartIndex] = timelinePart;
      } else {
        timelineData.push(timelinePart);
      }
    }

    if (config.timelineAllPaths) {
      for (let i=0;i<pathParts.length;i++) {
        const path = pathParts.slice(0, i+1).join('/');
        addTimelineNode(path);
      }
    } else {
      const path = fileChange.file;
      addTimelineNode(path);
    }
  })
  const timeline = [{
    group: config.repoDir,
    data: timelineData,
  }]

  fs.writeFileSync(path.join(__dirname, './timeline.data.json'), JSON.stringify(timeline, null, 2));
})();
