const https = require('https');

const options = {
  hostname: 'api.github.com',
  path: '/repos/SHAHBAZ-084/SERVE-LEAD/actions/runs',
  method: 'GET',
  headers: { 'User-Agent': 'Node.js' }
};

https.get(options, (res) => {
  let data = '';
  res.on('data', (chunk) => data += chunk);
  res.on('end', () => {
    const runs = JSON.parse(data).workflow_runs;
    const latestRun = runs[0];
    console.log(`Latest Run ID: ${latestRun.id}, Status: ${latestRun.conclusion}`);
    
    // get jobs for this run
    https.get({
      hostname: 'api.github.com',
      path: `/repos/SHAHBAZ-084/SERVE-LEAD/actions/runs/${latestRun.id}/jobs`,
      method: 'GET',
      headers: { 'User-Agent': 'Node.js' }
    }, (res2) => {
      let data2 = '';
      res2.on('data', (chunk) => data2 += chunk);
      res2.on('end', () => {
        const jobs = JSON.parse(data2).jobs;
        console.log("Jobs:");
        jobs.forEach(j => {
          console.log(`  ${j.name} - ${j.conclusion}`);
          j.steps.forEach(s => {
            console.log(`    Step: ${s.name} - ${s.conclusion}`);
            if (s.conclusion === 'failure') {
              console.log(`      FAILED STEP!!!`);
            }
          });
        });
      });
    });
  });
}).on('error', (err) => {
  console.log('Error: ' + err.message);
});
