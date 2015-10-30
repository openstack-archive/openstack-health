module.exports = {
  request: {
    method: 'JSONP',
    path: '/runs/metadata/keys'
  },
  response: {
    data: ['build_branch', 'build_change', 'build_master', 'build_name',
'build_node', 'build_patchset', 'build_queue', 'build_ref', 'build_short_uuid',
'build_uuid', 'build_zuul_url', 'filename', 'project', 'voting']
  }
};
