// components/publication_detail/goods/3waited_for_dis/3waited_for_dis.js
Component({
  properties: {
    list: {
      type: Array,
      value: []
    }
  },
  methods: {
    onEvaluate(e) {
      const id = e.currentTarget.dataset.id;
      this.triggerEvent('evaluate', { id });
    }
  }
});