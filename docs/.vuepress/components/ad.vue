<template>
  <div :class="[ 'ad-wrap', isDetail ? 'is-detail' : '' ]">
    <div class="_1pv6g5n8gf7"></div>
    <div class="_kro7189133e"></div>
  </div>
</template>

<script>
export default {
  computed: {
    isDetail: {
      get () {
        return this.$page.path.startsWith('/views/')
      }
    }
  },
  watch: {
    'isDetail': {
      handler () {
        this.initAd();
      }
    }
  },

  methods: {
    initAd() {
      if (this.isDetail === false) return;

      (window.slotbydup = window.slotbydup || []).push({
        id: "u6549166",
        container: "_1pv6g5n8gf7",
        async: true
      });
      (window.slotbydup = window.slotbydup || []).push({
        id: 'u6549049',
        container: '_kro7189133e',
        async: true
      });
    }
  },

  mounted() {
    this.initAd();
  }
}
</script>

<style lang="styl">
  .ad-wrap {
    display: none;
  }
  .is-detail {
    display: block;
  }
  ._1pv6g5n8gf7,
  ._kro7189133e {
    position: fixed;
    top: 14rem;
  }

  ._1pv6g5n8gf7 {
    left: 24rem;
  }

  ._kro7189133e {
    right: 4rem;
  }

  @media (max-width: 1520px) {
    ._1pv6g5n8gf7,
    ._kro7189133e {
      display: none;
    }
  }
</style>