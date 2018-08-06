const manifest = {
  async inject(compilation, options) {
    const s = 'HELLO GALAXY!';

    compilation.assets['test.txt'] = {
      source: function() {
        return s;
      },
      size: function() {
        return s.length;
      },
    };
  },
};

export default manifest;
