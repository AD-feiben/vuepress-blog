// 使用异步函数也是可以的
export default ({
  Vue, // VuePress 正在使用的 Vue 构造函数
  options, // 附加到根实例的一些选项
  router, // 当前应用的路由实例
  siteData, // 站点元数据
  isServer, // 当前应用配置是处于 服务端渲染 或 客户端
}) => {
  Vue.mixin({
    // 混合注入,加载全局文件
    mounted() {
      const footer = document.querySelector('.page-edit');
      const adClassName = '_yaaz0tul87e';
      let adContainer = document.querySelector('.' + adClassName);

      if (footer && !adContainer) {
        adContainer = document.createElement('div');
        adContainer.className = adClassName;
        footer.appendChild(adContainer);
        (window.slotbydup = window.slotbydup || []).push({
          id: 'u6544554',
          container: adClassName,
          async: true
        });
      }

      const container = document.querySelector('.theme-reco-content.content__default');
      const containerId = 'container';
      if (container && !container.getAttribute('id')) {
        container.setAttribute('id', containerId);
        window.btw = new BTWPlugin();
        window.btw.init({
          id: containerId,
          blogId: '26652-1621274015785-184',
          name: '前端develop',
          qrcode: 'https://feiben-1253434158.cos.ap-guangzhou.myqcloud.com/PicGo/qrcode_for_gh_6c8243f94d03_258.jpg',
          keyword: '验证码',
        });
      }


    }
  });
};