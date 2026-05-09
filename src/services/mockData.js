// Mock data shown when the extension is opened outside Tableau (e.g. on GitHub Pages
// directly, or during local `npm run dev`). Six tanks with a deliberate spread of
// stages and temperature bands so the demo exercises every visual state.

export const MOCK_TANKS = [
  { tankName: 'FV-01', temperature: 18.5, abv: 4.8, fillPercent: 92, fermentationStage: 'Active Fermentation', batchId: 'B-2061', status: 'Healthy' },
  { tankName: 'FV-02', temperature: 22.3, abv: 6.2, fillPercent: 78, fermentationStage: 'Active Fermentation', batchId: 'B-2062', status: 'Warning' },
  { tankName: 'FV-03', temperature: 12.1, abv: 5.4, fillPercent: 65, fermentationStage: 'Conditioning',        batchId: 'B-2058', status: 'Healthy' },
  { tankName: 'FV-04', temperature:  2.8, abv: 5.1, fillPercent: 88, fermentationStage: 'Cold Crash',          batchId: 'B-2055', status: 'Healthy' },
  { tankName: 'FV-05', temperature: 28.9, abv: 7.1, fillPercent: 45, fermentationStage: 'Active Fermentation', batchId: 'B-2063', status: 'Critical' },
  { tankName: 'FV-06', temperature: 15.2, abv: 4.5, fillPercent: 12, fermentationStage: 'Packaging Ready',     batchId: 'B-2050', status: 'Healthy' },
];

export const MOCK_COLUMNS = [
  'TankName', 'Temperature', 'ABV', 'FillPercent', 'FermentationStage', 'BatchID', 'Status'
];
