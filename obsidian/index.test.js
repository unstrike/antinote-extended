'use strict';
module.exports = function(cmds, { ok, section, p }) {
  section('obsidian');
  let r;

  // Input validation
  r = cmds.obs_task.execute(p(['']));
  ok('obs_task: empty title → error', r.status === 'error', null);

  r = cmds.obs_nlp.execute(p(['']));
  ok('obs_nlp: empty text → error', r.status === 'error', null);

  r = cmds.obs_done.execute(p([], 'not a checkbox line'));
  ok('obs_done: non-checkbox line → error', r.status === 'error', null);

  // Network calls fail gracefully (callAPI mock returns { success: false })
  r = cmds.obs_task.execute(p(['Review pentest findings']));
  ok('obs_task: network error → graceful error', r.status === 'error', null);

  r = cmds.obs_nlp.execute(p(['create a task tomorrow']));
  ok('obs_nlp: network error → graceful error', r.status === 'error', null);

  r = cmds.obs_tasks.execute(p(['open']));
  ok('obs_tasks: network error → graceful error', r.status === 'error', null);

  r = cmds.obs_done.execute(p([], '- [ ] Some task'));
  ok('obs_done: checkbox line → network error → graceful error', r.status === 'error', null);

  r = cmds.obs_stats.execute(p([]));
  ok('obs_stats: network error → graceful error', r.status === 'error', null);
};
