window.onload = () => {
  window.btw = new BTWPlugin();
  const container = document.querySelector('.content__default');
  container.setAttribute('id', 'container');
  window.btw.init({
    id: 'container',
    blogId: '26652-1621274015785-184',
    name: '前端develop',
    qrcode: 'https://feiben-1253434158.cos.ap-guangzhou.myqcloud.com/PicGo/qrcode_for_gh_6c8243f94d03_258.jpg',
    keyword: '验证码',
  });
}