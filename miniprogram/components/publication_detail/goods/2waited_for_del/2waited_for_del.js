// components/publication_detail/goods/2waited_for_del/2waited_for_del.js
Component({
  properties: {
    list: {
      type: Array,
      value: []
    }
  },
  methods: {
    onDeliver(e) {
      const id = e.currentTarget.dataset.id;
      this.triggerEvent('deliver', { id });
    }
  }
});