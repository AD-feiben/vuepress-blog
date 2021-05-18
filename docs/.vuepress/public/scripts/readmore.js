window.onload = () => {
  const container = document.querySelector('.theme-reco-content.content__default');
  if (!container) return;
  container.setAttribute('id', 'container');
  window.btw = new BTWPlugin();
  window.btw.init({
    id: 'container',
    blogId: '26652-1621274015785-184',
    name: '前端develop',
    qrcode: 'https://feiben-1253434158.cos.ap-guangzhou.myqcloud.com/PicGo/qrcode_for_gh_6c8243f94d03_258.jpg',
    keyword: '验证码',
  });
};
