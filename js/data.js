// Dữ liệu mặc định: theme và câu chúc
window.DEFAULT_THEMES = [
  {
    id: 'hoa-dao',
    name: 'Hồng ngọt',
    bg1: '#ffd9e8', bg2: '#fff2f7', card: '#ffffffee',
    text: '#4a1f3a', accent: '#e05c8a',
    font: "'Dancing Script', cursive", fx: 'bloom'
  },
  {
    id: 'sang-trong',
    name: 'Sang trọng',
    bg1: '#2b1c36', bg2: '#4b2d4f', card: '#ffffff14',
    text: '#f6e7f2', accent: '#e8b4c8',
    font: "'Playfair Display', serif", fx: 'sparkle'
  },
  {
    id: 'ao-dai',
    name: 'Áo dài vàng',
    bg1: '#ffe9b8', bg2: '#fff8e7', card: '#fffdf5ee',
    text: '#5a3b16', accent: '#c9873a',
    font: "'Lora', serif", fx: 'confetti'
  },
  {
    id: 'bien-xanh',
    name: 'Biển xanh',
    bg1: '#cfeaf5', bg2: '#f0fbff', card: '#ffffffee',
    text: '#17415c', accent: '#2d8fb8',
    font: "'Quicksand', sans-serif", fx: 'sparkle'
  },
  {
    id: 'tim-lavender',
    name: 'Lavender',
    bg1: '#e4dcff', bg2: '#f7f4ff', card: '#ffffffee',
    text: '#3b2a62', accent: '#7b5cd6',
    font: "'Playfair Display', serif", fx: 'heart'
  },
  {
    id: 'vuon-xanh',
    name: 'Vườn xanh',
    bg1: '#d8f0dc', bg2: '#f4fff6', card: '#ffffffee',
    text: '#204a30', accent: '#3d8f5c',
    font: "'Quicksand', sans-serif", fx: 'bloom'
  },
  {
    id: 'vuon-hoa-dem',
    name: 'Vườn hoa đêm',
    bg1: '#16102a', bg2: '#3a1d46', card: '#ffffff12',
    text: '#f3e8ff', accent: '#ff6fae',
    font: "'Dancing Script', cursive", fx: 'bloom'
  },
  {
    id: 'cau-vong',
    name: 'Cầu vồng',
    bg1: '#ffe0f0', bg2: '#e4f6ff', card: '#ffffffe6',
    text: '#3c2552', accent: '#ff4d9d',
    font: "'Dancing Script', cursive", fx: 'bloom'
  },
  {
    id: 'neon-disco',
    name: 'Neon disco',
    bg1: '#120b26', bg2: '#2a0f3f', card: '#ffffff14',
    text: '#f4ecff', accent: '#00e5ff',
    font: "'Quicksand', sans-serif", fx: 'confetti'
  },
  {
    id: 'hoang-hon',
    name: 'Hoàng hôn',
    bg1: '#ffc9a0', bg2: '#ffe9d2', card: '#fff8f0ee',
    text: '#5b2b1e', accent: '#ff7043',
    font: "'Playfair Display', serif", fx: 'bloom'
  }
];

/* ===== BỘ LỜI CHÚC =====
   Bộ "vo-con" là mặc định, viết cụ thể cho vợ và hai con gái.
   Các bộ còn lại giữ văn chung để gửi mẹ, đồng nghiệp, bạn bè. */
window.QUOTE_PACKS = [
  {
    id: 'vo-con',
    name: 'Vợ và hai con gái',
    desc: 'Riêng tư, cụ thể, giọng chồng nói với vợ',
    content: {
      eyebrow: 'Ngày Phụ nữ Việt Nam · 20 · 10',
      title: 'Gửi vợ và hai con gái',
      to: 'Ba người phụ nữ của anh',
      message: 'Anh không giỏi nói mấy câu ngọt ngào, nên anh ngồi làm cái trang này cho em.\nCảm ơn em đã chịu đựng một người chồng hay cắm mặt vào máy tính tới khuya, đã một mình dỗ hai đứa ngủ, đã nhớ hết lịch tiêm, lịch họp phụ huynh, cỡ áo của con, trong khi anh thì quên cả sinh nhật mình.\nHôm nay em ngủ thêm đi. Hai đứa để anh, cơm để anh. Nếu có cháy thì mình gọi đồ ăn ngoài.',
      from: '— Chồng của em, ba của hai đứa'
    },
    quotes: [
      'Anh cưới em vì thích em. Sống với em mười mấy năm rồi, anh mới hiểu là anh còn nể em nữa.',
      'Nhà mình có ba cô gái. Một người hay nhắc anh uống nước, hai người hay giành remote. Anh thương cả ba.',
      'Em có nhớ hồi mới sinh đứa đầu, em vừa khóc vừa cho con bú lúc hai giờ sáng không? Anh nhớ. Anh không bao giờ quên được.',
      'Hai con gái của ba: lớn lên không cần giỏi hơn ai, chỉ cần tử tế và biết tự lo cho mình như mẹ các con.',
      'Cảm ơn em vì những lần anh về muộn mà cơm vẫn còn nóng, dù anh biết em đã ăn một mình từ lâu.',
      'Anh thấy em mệt. Anh thấy cả những lần em quay đi để không ai thấy em khóc. Anh xin lỗi vì nhiều lúc im lặng.',
      'Điều may mắn nhất của anh không nằm trong cái CV nào cả. Nó là lúc mở cửa về nhà và có ba người đang chờ.',
      'Các con ơi, mẹ các con là người phụ nữ giỏi nhất ba từng gặp. Hôm nay mình cùng chúc mẹ nhé.',
      'Em đừng cố làm người mẹ hoàn hảo nữa. Hai đứa nó cần một người mẹ vui, chứ không cần một người mẹ kiệt sức.',
      'Một ngày hai con sẽ lớn, sẽ đi học xa, sẽ có nhà riêng. Lúc đó anh vẫn ở đây, pha trà cho em như bây giờ.',
      'Em cứ đi làm đẹp, đi cà phê với bạn, đi đâu cũng được. Nhà có anh. Anh làm được, thật đấy.',
      'Nếu được chọn lại, anh vẫn chọn em. Chọn cả cái tính hay càm ràm của em nữa.',
      'Hai đứa nhỏ giống em nhiều hơn giống anh, và anh mừng vì chuyện đó.',
      'Cảm ơn em đã biến một người đàn ông chỉ biết code thành một người biết lo cho người khác.'
    ],
    suggest: [
      'Hôm nay em nghỉ đi, bếp để anh. Cháy thì mình gọi đồ ăn ngoài.',
      'Anh ghi nhận hết: những đêm thức trông con, những sáng vẫn kịp giờ làm.',
      'Hai con gái là điều đẹp nhất em mang đến cho cuộc đời anh.',
      'Em là mẹ của hai đứa, nhưng trước đó em vẫn là cô gái anh thích. Đừng quên điều đó.',
      'Nhà có ba cô gái nên 20/10 nhà mình phải vui gấp ba.',
      'Các con gái của ba, lớn lên cứ tự tin, biết yêu thương và biết nói không khi cần.',
      'Em làm vợ, làm mẹ, làm cả chỗ dựa cho anh. Hôm nay em chỉ cần làm chính em.',
      'Anh biết mình chưa phải người chồng tốt nhất. Nhưng anh đang cố, mỗi ngày.',
      'Chúc em một ngày được ngủ đủ, ăn món mình thích, và không ai gọi "mẹ ơi".',
      'Cả nhà yêu mẹ nhất. Hai đứa nhỏ nói thế, anh chỉ gõ lại thôi.',
      'Mười mấy năm rồi, anh vẫn thấy em là người đẹp nhất trong phòng.',
      'Mọi thứ anh làm được đến hôm nay đều có một nửa là công của em.'
    ]
  },
  {
    id: 'chung',
    name: 'Chung cho mọi người',
    desc: 'Dùng gửi đồng nghiệp, bạn bè, nhóm chat',
    content: {
      eyebrow: 'Ngày Phụ nữ Việt Nam · 20 · 10',
      title: 'Chúc mừng ngày 20/10',
      to: 'Gửi tới những người phụ nữ tuyệt vời',
      message: 'Cảm ơn vì sự dịu dàng, mạnh mẽ và những yêu thương lặng lẽ mỗi ngày.\nChúc bạn thật nhiều sức khoẻ, bình an và hạnh phúc.',
      from: '— Với tất cả yêu thương'
    },
    quotes: [
      'Chúc mừng ngày 20/10! Mong bạn luôn rạng rỡ như nắng sớm và dịu dàng như gió chiều.',
      'Phụ nữ không cần hoàn hảo, chỉ cần hạnh phúc theo cách của riêng mình.',
      'Chúc bạn một ngày đầy hoa, một năm đầy tiếng cười và một đời đầy yêu thương.',
      'Người mạnh mẽ nhất không phải người không bao giờ mệt, mà là người vẫn dịu dàng sau tất cả.',
      'Cảm ơn vì sự tảo tần, bao dung và những yêu thương chưa bao giờ nói thành lời.',
      'Chúc bạn luôn tự tin toả sáng, vì bạn vốn đã rất đáng được yêu thương.',
      'Mong mọi điều tốt đẹp đều tìm được đường đến với bạn.',
      'Mỗi người phụ nữ là một câu chuyện đẹp. Chúc chuyện của bạn luôn có cái kết thật ấm.',
      'Chúc bạn sức khoẻ dồi dào, nụ cười thật tươi và túi tiền thật dày.',
      'Hãy cứ sống như hoa, nở theo nhịp của mình, không cần so với ai cả.'
    ],
    suggest: [
      'Chúc bạn ngày 20/10 ngập tràn niềm vui và những điều bất ngờ ngọt ngào.',
      'Dù trời có mưa, bạn vẫn là nắng của một ai đó. Chúc mừng ngày của bạn!',
      'Gửi bạn một ngày nhẹ nhàng, không deadline, không lo lắng, chỉ có yêu thương.',
      'Chúc bạn luôn đủ dũng cảm để theo đuổi điều mình muốn và đủ dịu dàng với chính mình.',
      'Phụ nữ Việt Nam: mềm mại như lụa, bền bỉ như tre. Chúc mừng 20/10!',
      'Mong bạn luôn được trân trọng, mỗi ngày đều như ngày 20/10.',
      'Chúc bạn giữ mãi sự hồn nhiên, dù năm tháng có đi qua bao nhiêu.',
      'Nhân ngày 20/10, chúc bạn thành công trong công việc và viên mãn trong tình yêu.',
      'Chúc bạn một ngày được nghỉ ngơi đúng nghĩa, vì bạn xứng đáng được như vậy.',
      'Cảm ơn vì đã luôn ở đó, mạnh mẽ và ấm áp. Chúc mừng ngày Phụ nữ Việt Nam!'
    ]
  },
  {
    id: 'me',
    name: 'Gửi mẹ',
    desc: 'Lời chúc dành cho mẹ',
    content: {
      eyebrow: 'Ngày Phụ nữ Việt Nam · 20 · 10',
      title: 'Gửi mẹ của con',
      to: 'Mẹ',
      message: 'Con lớn rồi mới hiểu những năm tháng mẹ đã đi qua không hề dễ dàng.\nChúc mẹ nhiều sức khoẻ, mẹ nhé.',
      from: '— Con của mẹ'
    },
    quotes: [
      'Mẹ ơi, con lớn rồi mới hiểu hồi đó mẹ đã vất vả thế nào.',
      'Cảm ơn mẹ vì những bữa cơm mẹ nấu mà con từng tưởng là chuyện hiển nhiên.',
      'Chúc mẹ sống thật lâu, thật khoẻ, để con còn kịp bù đắp cho mẹ.',
      'Mẹ đừng tiết kiệm cho con nữa. Giờ đến lượt con lo cho mẹ rồi.',
      'Điều con muốn nhất không phải giàu có, mà là mỗi năm vẫn còn được chúc mẹ ngày này.',
      'Mẹ cứ đi chơi, đi du lịch với các bạn của mẹ đi. Con lo được.',
      'Mẹ là người phụ nữ đầu tiên dạy con thế nào là yêu thương vô điều kiện.'
    ],
    suggest: [
      'Chúc mẹ 20/10 vui vẻ, khoẻ mạnh, và đừng thức khuya nữa nhé mẹ.',
      'Con xin lỗi vì những lần con nói chuyện không nhẹ nhàng với mẹ.',
      'Cả nhà mình vẫn ổn, vì mẹ đã giữ nó lại suốt bao nhiêu năm.',
      'Mẹ ơi, con thương mẹ. Con ít nói ra nhưng mẹ biết mà.',
      'Chúc mẹ có thật nhiều ngày thong thả, không phải lo cho ai cả.'
    ]
  }
];

function findPack(id) {
  return window.QUOTE_PACKS.find(p => p.id === id) || window.QUOTE_PACKS[0];
}

window.DEFAULT_PACK = 'vo-con';
window.DEFAULT_QUOTES = findPack(window.DEFAULT_PACK).quotes.slice();
window.SUGGEST_QUOTES = findPack(window.DEFAULT_PACK).suggest.slice();
window.DEFAULT_CONTENT = { ...findPack(window.DEFAULT_PACK).content };

window.LAYOUTS = [
  { id: 'hero', name: 'Toàn màn hình', desc: 'Chữ lớn phủ kín, không khung viền' },
  { id: 'card', name: 'Thiệp kính', desc: 'Khung kính mờ nổi, viền cầu vồng' },
  { id: 'split', name: 'Hai cột', desc: 'Lời chúc bên trái, ảnh bên phải' },
  { id: 'ribbon', name: 'Dải băng', desc: 'Ba dải màu nghiêng xếp lệch nhau' },
  { id: 'scroll', name: 'Cuộn giấy', desc: 'Giấy ngà cổ điển, nẹp màu hai đầu' },
  { id: 'polaroid', name: 'Ảnh dán tường', desc: 'Kiểu polaroid dán băng dính' }
];
