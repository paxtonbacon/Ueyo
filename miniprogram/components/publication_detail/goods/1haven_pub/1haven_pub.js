// components/publication_detail/goods/1haven_pub/1haven_pub.js
Component({
  properties: {
    list: {
      type: Array,
      value: []
    }
  },
  methods: {
    onShelve(e) {
      const id = e.currentTarget.dataset.id;
      this.triggerEvent('shelve', { id });
    },
    onManage(e) {
      const id = e.currentTarget.dataset.id;
      this.triggerEvent('manage', { id });
    }
  }
});