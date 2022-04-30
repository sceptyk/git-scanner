# Git scanner

## Purpose

Identify hotspots affected by specific tickets

## How to run

### Install dependencies

Run `yarn install`

### Configure

In `./src/process/config.json` set:

- repoDir - relative path to git project to analyze
- regex - regular expression to match git commits
- afterDate - date from which start analyzing logs (YYYY-MM-DD)
- includeTop - [optional] number of most target files to include in visualization and report
- ignore - [optional] array of paths to ignore e.g. mis-integration-test
- hideTickets - [optional] whether to hide tickets on summary
- timelineAllPaths - [optional] whether to show all intermidiate folders in timeline chart

### Run

#### Process git logs

Run `yarn process`

It outputs following files:

- summary.data.json which is human readable summary of top files
- timeline.data.json which is input file for timeline visualization
- treemap.data.json which is input file for treemap visualization

#### Visualize data

Run `yarn visualize`

Open http://localhost:1234 in the browser. You can choose between timeline or treemap view
