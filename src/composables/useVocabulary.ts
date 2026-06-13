import { ref, computed } from 'vue'
import type { Message, VocabularyWord, SuggestionWord } from '../types'
import { useOpenAI } from './useOpenAI'
import { useNVIDIA } from './useNVIDIA'

const { hasApiKey: hasOpenAIKey, sendMessage: sendOpenAIMessage } = useOpenAI()
const { hasApiKey: hasNVIDIAKey, sendMessage: sendNVIDIAMessage } = useNVIDIA()

export function useVocabulary() {
  const words = ref<VocabularyWord[]>([])
  const total = ref(0)
  const page = ref(1)
  const limit = ref(20)
  const loading = ref(false)
  const error = ref<string | null>(null)

  async function loadWords(p?: number) {
    if (p !== undefined) page.value = p
    loading.value = true
    error.value = null
    try {
      const res = await fetch(`/api/vocabulary?page=${page.value}&limit=${limit.value}`)
      if (!res.ok) throw new Error('Failed to load vocabulary')
      const data = await res.json()
      words.value = data.words
      total.value = data.total
      page.value = data.page
    } catch (e: any) {
      error.value = e.message
      console.warn('[Vocabulary]', e.message)
    } finally {
      loading.value = false
    }
  }

  async function addWord(
    word: string,
    meaning = '',
    example = '',
    note = ''
  ): Promise<string | null> {
    error.value = null
    try {
      const id = crypto.randomUUID()
      const res = await fetch('/api/vocabulary', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, word, meaning, example, note })
      })
      if (!res.ok) throw new Error('Failed to add word')
      await loadWords()
      return id
    } catch (e: any) {
      error.value = e.message
      console.warn('[Vocabulary]', e.message)
      return null
    }
  }

  async function deleteWord(id: string) {
    error.value = null
    try {
      const res = await fetch(`/api/vocabulary/${id}`, {
        method: 'DELETE'
      })
      if (!res.ok) throw new Error('Failed to delete word')
      await loadWords()
    } catch (e: any) {
      error.value = e.message
      console.warn('[Vocabulary]', e.message)
    }
  }

  async function updateWord(id: string, word: string, meaning: string, example: string, note: string): Promise<boolean> {
    error.value = null
    try {
      const res = await fetch(`/api/vocabulary/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ word, meaning, example, note })
      })
      if (!res.ok) throw new Error('Failed to update word')
      await loadWords()
      return true
    } catch (e: any) {
      error.value = e.message
      console.warn('[Vocabulary]', e.message)
      return false
    }
  }

  async function suggestWords(topic: string, count = 10): Promise<SuggestionWord[]> {
    const prompt = `Generate ${count} English vocabulary words about the topic "${topic}". Return ONLY a valid JSON array, no markdown formatting, no code fences, no explanation. Each item must follow this exact structure:
{
  "word": "...",
  "meanings": ["meaning 1 in Vietnamese", "meaning 2 in Vietnamese (if multiple)"],
  "example": {
    "en": "English sentence using the word",
    "vi": "Vietnamese translation of the sentence"
  }
}
If a word has multiple meanings in Vietnamese, include ALL of them in the meanings array. For words with only one meaning, the array should have one element. Make sure the words are useful for English learners at intermediate level.`

    let raw: string | null = null

    try {
      if (hasOpenAIKey.value) {
        const msg: Message = { id: crypto.randomUUID(), content: prompt, isUser: true, timestamp: new Date() }
        raw = await sendOpenAIMessage([msg])
      } else if (hasNVIDIAKey.value) {
        const msg: Message = { id: crypto.randomUUID(), content: prompt, isUser: true, timestamp: new Date() }
        raw = await sendNVIDIAMessage([msg])
      }
    } catch (e: any) {
      console.warn('[Vocabulary suggest] AI error, falling back to simulated', e.message)
    }

    if (raw) {
      try {
        // Handle AI sometimes wrapping JSON in markdown code fences
        let cleaned = raw.replace(/```json\s*/gi, '').replace(/```\s*/g, '').trim()
        // Find first [ and last ]
        const start = cleaned.indexOf('[')
        const end = cleaned.lastIndexOf(']')
        if (start !== -1 && end !== -1) {
          cleaned = cleaned.slice(start, end + 1)
        }
        const parsed = JSON.parse(cleaned)
        if (Array.isArray(parsed) && parsed.length > 0) {
          return parsed.slice(0, count)
        }
      } catch (e: any) {
        console.warn('[Vocabulary suggest] Failed to parse AI response', e.message, raw)
      }
    }

    return getSimulatedSuggestions(topic, count)
  }

  const totalPages = computed(() => Math.max(1, Math.ceil(total.value / limit.value)))

  return {
    words,
    total,
    page,
    limit,
    totalPages,
    loading,
    error,
    loadWords,
    addWord,
    deleteWord,
    updateWord,
    suggestWords
  }
}

// --- Simulated data fallback ---

const SIMULATED_WORDS: Record<string, SuggestionWord[]> = {
  'Gia đình': [
    { word: 'relative', meanings: ['họ hàng', 'người thân'], example: { en: 'I have a close relative who lives in the United States.', vi: 'Tôi có một người họ hàng thân thiết sống ở Mỹ.' } },
    { word: 'sibling', meanings: ['anh chị em ruột'], example: { en: 'My sibling and I used to share a room when we were young.', vi: 'Anh trai tôi và tôi từng ở chung phòng khi còn nhỏ.' } },
    { word: 'nurture', meanings: ['nuôi dưỡng'], example: { en: 'Parents should nurture their children\'s talents.', vi: 'Cha mẹ nên nuôi dưỡng tài năng của con cái.' } },
    { word: 'household', meanings: ['hộ gia đình'], example: { en: 'There are four people in my household.', vi: 'Có bốn người trong hộ gia đình tôi.' } },
    { word: 'ancestor', meanings: ['tổ tiên'], example: { en: 'My ancestors came from a small village in Vietnam.', vi: 'Tổ tiên tôi đến từ một ngôi làng nhỏ ở Việt Nam.' } },
    { word: 'upbringing', meanings: ['sự nuôi dạy', 'sự giáo dục'], example: { en: 'She had a strict upbringing but she is grateful for it.', vi: 'Cô ấy được nuôi dạy nghiêm khắc nhưng cô ấy biết ơn vì điều đó.' } },
    { word: 'bond', meanings: ['sự gắn kết', 'mối quan hệ'], example: { en: 'The bond between mother and child is very strong.', vi: 'Sự gắn kết giữa mẹ và con rất bền chặt.' } },
    { word: 'generation', meanings: ['thế hệ'], example: { en: 'The younger generation is more tech-savvy.', vi: 'Thế hệ trẻ am hiểu công nghệ hơn.' } },
    { word: 'guardian', meanings: ['người giám hộ'], example: { en: 'His guardian signed the permission form for the school trip.', vi: 'Người giám hộ của cậu ấy đã ký vào đơn xin phép cho chuyến đi của trường.' } },
    { word: 'offspring', meanings: ['con cái', 'con cháu'], example: { en: 'The birds returned to feed their offspring.', vi: 'Những chú chim quay về để kiếm ăn cho con non của chúng.' } },
  ],
  'Công việc': [
    { word: 'deadline', meanings: ['hạn chót', 'thời hạn'], example: { en: 'We need to finish this project before the deadline.', vi: 'Chúng ta cần hoàn thành dự án này trước hạn chót.' } },
    { word: 'colleague', meanings: ['đồng nghiệp'], example: { en: 'My colleague helped me with the report.', vi: 'Đồng nghiệp của tôi đã giúp tôi làm báo cáo.' } },
    { word: 'promotion', meanings: ['sự thăng chức'], example: { en: 'She got a promotion after working hard for two years.', vi: 'Cô ấy được thăng chức sau hai năm làm việc chăm chỉ.' } },
    { word: 'workload', meanings: ['khối lượng công việc'], example: { en: 'The workload has been increasing recently.', vi: 'Khối lượng công việc đang tăng lên gần đây.' } },
    { word: 'negotiate', meanings: ['đàm phán', 'thương lượng'], example: { en: 'We need to negotiate the terms of the contract.', vi: 'Chúng ta cần đàm phán các điều khoản của hợp đồng.' } },
    { word: 'productivity', meanings: ['năng suất'], example: { en: 'Good sleep can improve your productivity at work.', vi: 'Ngủ ngon có thể cải thiện năng suất làm việc của bạn.' } },
    { word: 'resign', meanings: ['từ chức', 'xin nghỉ việc'], example: { en: 'He decided to resign from his position.', vi: 'Anh ấy quyết định từ chức.' } },
    { word: 'supervisor', meanings: ['người giám sát'], example: { en: 'My supervisor gave me feedback on the presentation.', vi: 'Người giám sát của tôi đã đưa ra phản hồi về bài thuyết trình.' } },
    { word: 'assignment', meanings: ['nhiệm vụ', 'bài tập'], example: { en: 'I have three assignments due next week.', vi: 'Tôi có ba nhiệm vụ cần nộp vào tuần sau.' } },
    { word: 'collaborate', meanings: ['cộng tác', 'hợp tác'], example: { en: 'Our teams collaborate on many projects together.', vi: 'Các nhóm của chúng tôi hợp tác với nhau trong nhiều dự án.' } },
  ],
  'Du lịch': [
    { word: 'itinerary', meanings: ['hành trình', 'lịch trình'], example: { en: 'Our travel itinerary includes three cities in Europe.', vi: 'Hành trình du lịch của chúng tôi bao gồm ba thành phố ở châu Âu.' } },
    { word: 'destination', meanings: ['điểm đến'], example: { en: 'Bali is a popular tourist destination.', vi: 'Bali là một điểm đến du lịch nổi tiếng.' } },
    { word: 'accommodation', meanings: ['chỗ ở'], example: { en: 'We booked accommodation near the beach.', vi: 'Chúng tôi đã đặt chỗ ở gần bãi biển.' } },
    { word: 'souvenir', meanings: ['quà lưu niệm'], example: { en: 'I bought a souvenir for my family.', vi: 'Tôi đã mua một món quà lưu niệm cho gia đình.' } },
    { word: 'landmark', meanings: ['thắng cảnh', 'địa điểm nổi tiếng'], example: { en: 'The Eiffel Tower is a famous landmark.', vi: 'Tháp Eiffel là một thắng cảnh nổi tiếng.' } },
    { word: 'passport', meanings: ['hộ chiếu'], example: { en: 'Make sure your passport is valid before traveling.', vi: 'Hãy chắc chắn rằng hộ chiếu của bạn còn hạn trước khi đi du lịch.' } },
    { word: 'reservation', meanings: ['sự đặt trước', 'sự đặt chỗ'], example: { en: 'I made a reservation at the hotel for two nights.', vi: 'Tôi đã đặt trước khách sạn hai đêm.' } },
    { word: 'sightseeing', meanings: ['tham quan', 'ngắm cảnh'], example: { en: 'We spent the day sightseeing around the city.', vi: 'Chúng tôi đã dành cả ngày tham quan thành phố.' } },
    { word: 'luggage', meanings: ['hành lý'], example: { en: 'Please keep an eye on your luggage at all times.', vi: 'Hãy luôn để mắt đến hành lý của bạn.' } },
    { word: 'currency', meanings: ['tiền tệ'], example: { en: 'You need to exchange currency before you travel.', vi: 'Bạn cần đổi tiền trước khi đi du lịch.' } },
  ],
  'Thời tiết': [
    { word: 'humidity', meanings: ['độ ẩm'], example: { en: 'The humidity in summer can be very uncomfortable.', vi: 'Độ ẩm vào mùa hè có thể rất khó chịu.' } },
    { word: 'forecast', meanings: ['dự báo'], example: { en: 'The weather forecast says it will rain tomorrow.', vi: 'Dự báo thời tiết nói rằng ngày mai trời sẽ mưa.' } },
    { word: 'thunderstorm', meanings: ['giông bão'], example: { en: 'A thunderstorm is approaching from the west.', vi: 'Một cơn giông bão đang đến gần từ phía tây.' } },
    { word: 'drizzle', meanings: ['mưa phùn'], example: { en: 'A light drizzle started falling in the afternoon.', vi: 'Một cơn mưa phùn nhẹ bắt đầu rơi vào buổi chiều.' } },
    { word: 'scorching', meanings: ['nóng như thiêu', 'nóng gay gắt'], example: { en: 'The scorching heat made it hard to work outside.', vi: 'Cái nóng gay gắt khiến việc làm việc ngoài trời trở nên khó khăn.' } },
    { word: 'breeze', meanings: ['gió nhẹ', 'làn gió'], example: { en: 'A gentle breeze made the hot weather bearable.', vi: 'Một làn gió nhẹ khiến thời tiết nóng bức trở nên dễ chịu hơn.' } },
    { word: 'frost', meanings: ['sương giá'], example: { en: 'The garden was covered in frost this morning.', vi: 'Khu vườn bị phủ đầy sương giá sáng nay.' } },
    { word: 'downpour', meanings: ['mưa như trút nước'], example: { en: 'We got caught in a sudden downpour without an umbrella.', vi: 'Chúng tôi bị kẹt trong cơn mưa như trút nước mà không có ô.' } },
    { word: 'foggy', meanings: ['có sương mù', 'mờ mịt'], example: { en: 'The road was dangerous because it was very foggy.', vi: 'Con đường rất nguy hiểm vì sương mù dày đặc.' } },
    { word: 'mild', meanings: ['ôn hòa', 'dịu nhẹ'], example: { en: 'The weather here is mild all year round.', vi: 'Thời tiết ở đây ôn hòa quanh năm.' } },
  ],
  'Ẩm thực': [
    { word: 'cuisine', meanings: ['ẩm thực', 'cách nấu nướng'], example: { en: 'Vietnamese cuisine is known for its fresh ingredients.', vi: 'Ẩm thực Việt Nam nổi tiếng với các nguyên liệu tươi sống.' } },
    { word: 'ingredient', meanings: ['nguyên liệu'], example: { en: 'Fresh herbs are a key ingredient in this dish.', vi: 'Các loại rau thơm là nguyên liệu chính trong món ăn này.' } },
    { word: 'appetizer', meanings: ['món khai vị'], example: { en: 'We ordered spring rolls as an appetizer.', vi: 'Chúng tôi gọi chả giò làm món khai vị.' } },
    { word: 'recipe', meanings: ['công thức nấu ăn'], example: { en: 'Can you share your recipe for pho?', vi: 'Bạn có thể chia sẻ công thức nấu phở của mình không?' } },
    { word: 'flavor', meanings: ['hương vị'], example: { en: 'This dish has a unique and delicious flavor.', vi: 'Món ăn này có một hương vị độc đáo và ngon miệng.' } },
    { word: 'gourmet', meanings: ['sành ăn', 'cao cấp'], example: { en: 'The restaurant serves gourmet French cuisine.', vi: 'Nhà hàng phục vụ ẩm thực Pháp cao cấp.' } },
    { word: 'portion', meanings: ['phần ăn', 'khẩu phần'], example: { en: 'The portion size was generous.', vi: 'Khẩu phần ăn rất hào phóng.' } },
    { word: 'beverage', meanings: ['đồ uống'], example: { en: 'What beverage would you like with your meal?', vi: 'Bạn muốn đồ uống gì kèm với bữa ăn?' } },
    { word: 'nutrition', meanings: ['dinh dưỡng'], example: { en: 'Good nutrition is important for a healthy life.', vi: 'Dinh dưỡng tốt rất quan trọng cho một cuộc sống khỏe mạnh.' } },
    { word: 'delicacy', meanings: ['cao lương mỹ vị', 'đặc sản'], example: { en: 'This cheese is considered a local delicacy.', vi: 'Loại phô mai này được coi là một đặc sản địa phương.' } },
  ],
  'Sức khỏe': [
    { word: 'wellness', meanings: ['sức khỏe tốt', 'sự an lành'], example: { en: 'The spa focuses on wellness and relaxation.', vi: 'Spa tập trung vào sức khỏe và thư giãn.' } },
    { word: 'symptom', meanings: ['triệu chứng'], example: { en: 'The symptoms include fever and a sore throat.', vi: 'Các triệu chứng bao gồm sốt và đau họng.' } },
    { word: 'diagnosis', meanings: ['chẩn đoán'], example: { en: 'The doctor made a diagnosis after running some tests.', vi: 'Bác sĩ đã chẩn đoán sau khi chạy một số xét nghiệm.' } },
    { word: 'therapy', meanings: ['liệu pháp', 'trị liệu'], example: { en: 'Physical therapy helped him recover from the injury.', vi: 'Vật lý trị liệu đã giúp anh ấy hồi phục sau chấn thương.' } },
    { word: 'immunity', meanings: ['miễn dịch'], example: { en: 'A healthy diet can boost your immune system.', vi: 'Một chế độ ăn uống lành mạnh có thể tăng cường hệ miễn dịch của bạn.' } },
    { word: 'prescription', meanings: ['đơn thuốc'], example: { en: 'You need a prescription to buy this medicine.', vi: 'Bạn cần đơn thuốc để mua loại thuốc này.' } },
    { word: 'recovery', meanings: ['sự hồi phục'], example: { en: 'Her recovery after surgery was surprisingly fast.', vi: 'Sự hồi phục của cô ấy sau phẫu thuật nhanh đáng ngạc nhiên.' } },
    { word: 'precaution', meanings: ['phòng ngừa', 'phòng tránh'], example: { en: 'Wearing a mask is a good precaution during flu season.', vi: 'Đeo khẩu trang là một biện pháp phòng ngừa tốt trong mùa cúm.' } },
    { word: 'chronic', meanings: ['mãn tính'], example: { en: 'She suffers from chronic back pain.', vi: 'Cô ấy bị đau lưng mãn tính.' } },
    { word: 'nutritionist', meanings: ['chuyên gia dinh dưỡng'], example: { en: 'A nutritionist recommended a balanced diet.', vi: 'Một chuyên gia dinh dưỡng đã khuyên một chế độ ăn uống cân bằng.' } },
  ],
  'Giải trí': [
    { word: 'hobby', meanings: ['sở thích'], example: { en: 'My favorite hobby is reading books.', vi: 'Sở thích yêu thích của tôi là đọc sách.' } },
    { word: 'entertainment', meanings: ['sự giải trí'], example: { en: 'The city offers many entertainment options.', vi: 'Thành phố này có nhiều lựa chọn giải trí.' } },
    { word: 'audience', meanings: ['khán giả'], example: { en: 'The audience clapped loudly after the performance.', vi: 'Khán giả đã vỗ tay rất to sau buổi biểu diễn.' } },
    { word: 'performance', meanings: ['buổi biểu diễn', 'màn trình diễn'], example: { en: 'The dance performance was absolutely stunning.', vi: 'Màn trình diễn múa thật sự ngoạn mục.' } },
    { word: 'genre', meanings: ['thể loại'], example: { en: 'Science fiction is my favorite movie genre.', vi: 'Khoa học viễn tưởng là thể loại phim yêu thích của tôi.' } },
    { word: 'blockbuster', meanings: ['phim bom tấn'], example: { en: 'The new superhero movie is a summer blockbuster.', vi: 'Bộ phim siêu anh hùng mới là một bom tấn mùa hè.' } },
    { word: 'concert', meanings: ['buổi hòa nhạc'], example: { en: 'We attended an amazing concert last night.', vi: 'Chúng tôi đã tham dự một buổi hòa nhạc tuyệt vời tối qua.' } },
    { word: 'recreation', meanings: ['sự giải trí', 'sự thư giãn'], example: { en: 'The park offers various recreation activities.', vi: 'Công viên cung cấp nhiều hoạt động giải trí khác nhau.' } },
    { word: 'festival', meanings: ['lễ hội'], example: { en: 'The festival attracts thousands of visitors every year.', vi: 'Lễ hội thu hút hàng nghìn du khách mỗi năm.' } },
    { word: 'spectator', meanings: ['khán giả (sự kiện thể thao)'], example: { en: 'The spectators cheered for their favorite team.', vi: 'Khán giả cổ vũ cho đội bóng yêu thích của họ.' } },
  ],
  'Mua sắm': [
    { word: 'bargain', meanings: ['món hời', 'sự mặc cả'], example: { en: 'I found a great bargain at the flea market.', vi: 'Tôi đã tìm được một món hời tuyệt vời ở chợ trời.' } },
    { word: 'receipt', meanings: ['hóa đơn', 'biên lai'], example: { en: 'Please keep your receipt in case you want a refund.', vi: 'Vui lòng giữ hóa đơn đề phòng bạn muốn hoàn tiền.' } },
    { word: 'discount', meanings: ['giảm giá'], example: { en: 'Students get a 10% discount at this store.', vi: 'Sinh viên được giảm giá 10% tại cửa hàng này.' } },
    { word: 'refund', meanings: ['hoàn tiền'], example: { en: 'The store offered a full refund for the defective item.', vi: 'Cửa hàng đã đề nghị hoàn lại toàn bộ tiền cho sản phẩm bị lỗi.' } },
    { word: 'browse', meanings: ['xem qua', 'lướt xem'], example: { en: 'I like to browse the bookstore on weekends.', vi: 'Tôi thích lướt xem hiệu sách vào cuối tuần.' } },
    { word: 'purchase', meanings: ['mua hàng'], example: { en: 'Thank you for your purchase.', vi: 'Cảm ơn bạn đã mua hàng.' } },
    { word: 'essential', meanings: ['nhu yếu phẩm', 'thiết yếu'], example: { en: 'Water is essential for survival.', vi: 'Nước là thiết yếu cho sự sống.' } },
    { word: 'luxury', meanings: ['xa xỉ'], example: { en: 'A vacation in the Maldives is a luxury I can\'t afford.', vi: 'Một kỳ nghỉ ở Maldives là thứ xa xỉ mà tôi không thể chi trả.' } },
    { word: 'barcode', meanings: ['mã vạch'], example: { en: 'The cashier scanned the barcode on the product.', vi: 'Nhân viên thu ngân đã quét mã vạch trên sản phẩm.' } },
    { word: 'warranty', meanings: ['bảo hành'], example: { en: 'This laptop comes with a two-year warranty.', vi: 'Chiếc máy tính xách tay này được bảo hành hai năm.' } },
  ],
  'Giao thông': [
    { word: 'commute', meanings: ['đi lại hàng ngày', 'sự di chuyển'], example: { en: 'My daily commute takes about 45 minutes.', vi: 'Việc đi lại hàng ngày của tôi mất khoảng 45 phút.' } },
    { word: 'congestion', meanings: ['tắc nghẽn'], example: { en: 'Traffic congestion is worst during rush hour.', vi: 'Tắc nghẽn giao thông tồi tệ nhất vào giờ cao điểm.' } },
    { word: 'pedestrian', meanings: ['người đi bộ'], example: { en: 'The pedestrian crossed the street at the crosswalk.', vi: 'Người đi bộ băng qua đường ở vạch sang đường.' } },
    { word: 'vehicle', meanings: ['xe cộ', 'phương tiện'], example: { en: 'The vehicle was moving very slowly in traffic.', vi: 'Chiếc xe đang di chuyển rất chậm trong dòng giao thông.' } },
    { word: 'intersection', meanings: ['ngã tư', 'giao lộ'], example: { en: 'Turn left at the next intersection.', vi: 'Rẽ trái ở ngã tư tiếp theo.' } },
    { word: 'fare', meanings: ['giá vé'], example: { en: 'The bus fare has increased to 25,000 VND.', vi: 'Giá vé xe buýt đã tăng lên 25.000 đồng.' } },
    { word: 'detour', meanings: ['đường vòng'], example: { en: 'We had to take a detour because of the road construction.', vi: 'Chúng tôi phải đi đường vòng vì công trình xây dựng trên đường.' } },
    { word: 'infrastructure', meanings: ['cơ sở hạ tầng'], example: { en: 'The city is investing in new infrastructure.', vi: 'Thành phố đang đầu tư vào cơ sở hạ tầng mới.' } },
    { word: 'terminal', meanings: ['bến', 'ga', 'nhà ga'], example: { en: 'The flight departs from Terminal 2.', vi: 'Chuyến bay khởi hành từ Nhà ga số 2.' } },
    { word: 'schedule', meanings: ['lịch trình'], example: { en: 'The train schedule has changed for the holidays.', vi: 'Lịch trình tàu đã thay đổi cho kỳ nghỉ lễ.' } },
  ],
  'Trường học': [
    { word: 'curriculum', meanings: ['chương trình giảng dạy'], example: { en: 'The school curriculum includes both arts and sciences.', vi: 'Chương trình giảng dạy của trường bao gồm cả nghệ thuật và khoa học.' } },
    { word: 'assignment', meanings: ['bài tập', 'nhiệm vụ'], example: { en: 'I have three assignments due next week.', vi: 'Tôi có ba bài tập cần nộp vào tuần sau.' } },
    { word: 'scholarship', meanings: ['học bổng'], example: { en: 'She won a scholarship to study abroad.', vi: 'Cô ấy đã giành được học bổng du học.' } },
    { word: 'lecture', meanings: ['bài giảng'], example: { en: 'The lecture on biology was very informative.', vi: 'Bài giảng về sinh học rất giàu thông tin.' } },
    { word: 'campus', meanings: ['khuôn viên trường'], example: { en: 'The university campus is beautiful in autumn.', vi: 'Khuôn viên trường đại học rất đẹp vào mùa thu.' } },
    { word: 'tutor', meanings: ['gia sư'], example: { en: 'I hired a tutor to help me with math.', vi: 'Tôi đã thuê một gia sư để giúp tôi học toán.' } },
    { word: 'examination', meanings: ['kỳ thi'], example: { en: 'The final examination will be held in May.', vi: 'Kỳ thi cuối kỳ sẽ được tổ chức vào tháng Năm.' } },
    { word: 'tuition', meanings: ['học phí'], example: { en: 'The tuition fee increases every year.', vi: 'Học phí tăng lên mỗi năm.' } },
    { word: 'diploma', meanings: ['bằng tốt nghiệp'], example: { en: 'He received his diploma at the graduation ceremony.', vi: 'Anh ấy đã nhận bằng tốt nghiệp tại lễ tốt nghiệp.' } },
    { word: 'matriculate', meanings: ['nhập học (đại học)'], example: { en: 'She will matriculate at Harvard next fall.', vi: 'Cô ấy sẽ nhập học tại Harvard vào mùa thu tới.' } },
  ],
  'Công nghệ': [
    { word: 'algorithm', meanings: ['thuật toán'], example: { en: 'The algorithm sorts data very efficiently.', vi: 'Thuật toán sắp xếp dữ liệu rất hiệu quả.' } },
    { word: 'software', meanings: ['phần mềm'], example: { en: 'We need to update the software regularly.', vi: 'Chúng ta cần cập nhật phần mềm thường xuyên.' } },
    { word: 'database', meanings: ['cơ sở dữ liệu'], example: { en: 'All customer information is stored in a database.', vi: 'Tất cả thông tin khách hàng được lưu trữ trong cơ sở dữ liệu.' } },
    { word: 'bandwidth', meanings: ['băng thông'], example: { en: 'The video requires high bandwidth to stream.', vi: 'Video yêu cầu băng thông cao để phát trực tuyến.' } },
    { word: 'encryption', meanings: ['mã hóa'], example: { en: 'Encryption keeps your personal data secure.', vi: 'Mã hóa giữ cho dữ liệu cá nhân của bạn an toàn.' } },
    { word: 'innovation', meanings: ['sự đổi mới', 'sáng kiến'], example: { en: 'Innovation drives the tech industry forward.', vi: 'Sự đổi mới thúc đẩy ngành công nghệ tiến lên.' } },
    { word: 'artificial', meanings: ['nhân tạo'], example: { en: 'Artificial intelligence is changing the world.', vi: 'Trí tuệ nhân tạo đang thay đổi thế giới.' } },
    { word: 'automation', meanings: ['tự động hóa'], example: { en: 'Automation helps factories produce goods faster.', vi: 'Tự động hóa giúp nhà máy sản xuất hàng hóa nhanh hơn.' } },
    { word: 'cybersecurity', meanings: ['an ninh mạng'], example: { en: 'Cybersecurity is essential for protecting online data.', vi: 'An ninh mạng rất cần thiết để bảo vệ dữ liệu trực tuyến.' } },
    { word: 'interface', meanings: ['giao diện'], example: { en: 'The app interface is user-friendly and intuitive.', vi: 'Giao diện ứng dụng thân thiện và trực quan.' } },
  ],
  'Kinh doanh': [
    { word: 'revenue', meanings: ['doanh thu'], example: { en: 'The company revenue increased by 20% this year.', vi: 'Doanh thu của công ty đã tăng 20% trong năm nay.' } },
    { word: 'investment', meanings: ['đầu tư'], example: { en: 'Making a wise investment can secure your future.', vi: 'Đầu tư khôn ngoan có thể đảm bảo tương lai của bạn.' } },
    { word: 'strategy', meanings: ['chiến lược'], example: { en: 'We need a new strategy to reach more customers.', vi: 'Chúng tôi cần một chiến lược mới để tiếp cận nhiều khách hàng hơn.' } },
    { word: 'profit', meanings: ['lợi nhuận'], example: { en: 'The business made a good profit this quarter.', vi: 'Doanh nghiệp đã đạt được lợi nhuận tốt trong quý này.' } },
    { word: 'stakeholder', meanings: ['bên liên quan'], example: { en: 'All stakeholders must agree before we proceed.', vi: 'Tất cả các bên liên quan phải đồng ý trước khi chúng tôi tiến hành.' } },
    { word: 'brand', meanings: ['thương hiệu'], example: { en: 'Building a strong brand takes years of effort.', vi: 'Xây dựng một thương hiệu mạnh cần nhiều năm nỗ lực.' } },
    { word: 'economy', meanings: ['nền kinh tế'], example: { en: 'The economy is growing steadily this year.', vi: 'Nền kinh tế đang tăng trưởng ổn định trong năm nay.' } },
    { word: 'startup', meanings: ['công ty khởi nghiệp'], example: { en: 'The startup received funding from several investors.', vi: 'Công ty khởi nghiệp đã nhận được tài trợ từ nhiều nhà đầu tư.' } },
    { word: 'merger', meanings: ['sự sáp nhập'], example: { en: 'The merger between the two companies was successful.', vi: 'Sự sáp nhập giữa hai công ty đã thành công.' } },
    { word: 'outsource', meanings: ['thuê ngoài', 'gia công'], example: { en: 'Many companies outsource customer service.', vi: 'Nhiều công ty thuê ngoài dịch vụ chăm sóc khách hàng.' } },
  ],
  'Môi trường': [
    { word: 'sustainable', meanings: ['bền vững'], example: { en: 'We need to adopt more sustainable practices.', vi: 'Chúng ta cần áp dụng các biện pháp bền vững hơn.' } },
    { word: 'pollution', meanings: ['ô nhiễm'], example: { en: 'Air pollution is a major problem in big cities.', vi: 'Ô nhiễm không khí là một vấn đề lớn ở các thành phố lớn.' } },
    { word: 'renewable', meanings: ['có thể tái tạo'], example: { en: 'Solar and wind are renewable energy sources.', vi: 'Năng lượng mặt trời và gió là các nguồn năng lượng tái tạo.' } },
    { word: 'biodiversity', meanings: ['đa dạng sinh học'], example: { en: 'The rainforest is home to incredible biodiversity.', vi: 'Rừng nhiệt đới là nơi có sự đa dạng sinh học đáng kinh ngạc.' } },
    { word: 'conservation', meanings: ['bảo tồn'], example: { en: 'Wildlife conservation efforts have helped protect endangered species.', vi: 'Các nỗ lực bảo tồn động vật hoang dã đã giúp bảo vệ các loài có nguy cơ tuyệt chủng.' } },
    { word: 'ecosystem', meanings: ['hệ sinh thái'], example: { en: 'Coral reefs are a delicate ecosystem.', vi: 'Rạn san hô là một hệ sinh thái mong manh.' } },
    { word: 'emission', meanings: ['khí thải'], example: { en: 'Carbon emissions contribute to global warming.', vi: 'Khí thải carbon góp phần vào sự nóng lên toàn cầu.' } },
    { word: 'recycle', meanings: ['tái chế'], example: { en: 'We should recycle plastic to reduce waste.', vi: 'Chúng ta nên tái chế nhựa để giảm rác thải.' } },
    { word: 'climate', meanings: ['khí hậu'], example: { en: 'Climate change is affecting weather patterns worldwide.', vi: 'Biến đổi khí hậu đang ảnh hưởng đến các kiểu thời tiết trên toàn thế giới.' } },
    { word: 'deforestation', meanings: ['phá rừng'], example: { en: 'Deforestation threatens many animal habitats.', vi: 'Phá rừng đe dọa môi trường sống của nhiều loài động vật.' } },
  ],
  'Văn hóa': [
    { word: 'tradition', meanings: ['truyền thống'], example: { en: 'We keep the tradition of making banh chung during Tet.', vi: 'Chúng tôi giữ truyền thống gói bánh chưng trong dịp Tết.' } },
    { word: 'custom', meanings: ['phong tục'], example: { en: 'It is a custom to remove your shoes before entering a home.', vi: 'Đó là phong tục bỏ giày trước khi vào nhà.' } },
    { word: 'heritage', meanings: ['di sản'], example: { en: 'Ha Long Bay is a UNESCO World Heritage site.', vi: 'Vịnh Hạ Long là di sản thế giới được UNESCO công nhận.' } },
    { word: 'diversity', meanings: ['sự đa dạng'], example: { en: 'Cultural diversity makes our society richer.', vi: 'Sự đa dạng văn hóa làm cho xã hội chúng ta phong phú hơn.' } },
    { word: 'festival', meanings: ['lễ hội'], example: { en: 'The Mid-Autumn Festival is loved by children.', vi: 'Tết Trung Thu được trẻ em yêu thích.' } },
    { word: 'ceremony', meanings: ['nghi lễ'], example: { en: 'The wedding ceremony was beautiful and meaningful.', vi: 'Lễ cưới thật đẹp và ý nghĩa.' } },
    { word: 'belief', meanings: ['niềm tin', 'tín ngưỡng'], example: { en: 'People have different religious beliefs.', vi: 'Mọi người có tín ngưỡng tôn giáo khác nhau.' } },
    { word: 'folk', meanings: ['dân gian'], example: { en: 'Folk tales teach us valuable life lessons.', vi: 'Truyện dân gian dạy chúng ta những bài học quý giá.' } },
    { word: 'ethnic', meanings: ['dân tộc', 'thuộc về dân tộc'], example: { en: 'Vietnam has 54 ethnic groups with unique cultures.', vi: 'Việt Nam có 54 dân tộc với những nét văn hóa độc đáo.' } },
    { word: 'ritual', meanings: ['nghi thức'], example: { en: 'The tea ceremony is an important Japanese ritual.', vi: 'Trà đạo là một nghi thức quan trọng của người Nhật.' } },
  ],
  'Thể thao': [
    { word: 'tournament', meanings: ['giải đấu'], example: { en: 'The football tournament takes place every four years.', vi: 'Giải đấu bóng đá diễn ra bốn năm một lần.' } },
    { word: 'championship', meanings: ['chức vô địch'], example: { en: 'Our team won the championship last season.', vi: 'Đội của chúng tôi đã giành chức vô địch mùa trước.' } },
    { word: 'athlete', meanings: ['vận động viên'], example: { en: 'He is a professional athlete training for the Olympics.', vi: 'Anh ấy là vận động viên chuyên nghiệp đang luyện tập cho Thế vận hội.' } },
    { word: 'stadium', meanings: ['sân vận động'], example: { en: 'The stadium can hold over 50,000 spectators.', vi: 'Sân vận động có thể chứa hơn 50.000 khán giả.' } },
    { word: 'coach', meanings: ['huấn luyện viên'], example: { en: 'The coach inspired the team to play their best.', vi: 'Huấn luyện viên đã truyền cảm hứng cho đội để chơi hết mình.' } },
    { word: 'defeat', meanings: ['đánh bại', 'thất bại'], example: { en: 'They managed to defeat the defending champions.', vi: 'Họ đã đánh bại được nhà đương kim vô địch.' } },
    { word: 'spectator', meanings: ['khán giả'], example: { en: 'Thousands of spectators cheered at the stadium.', vi: 'Hàng nghìn khán giả đã cổ vũ tại sân vận động.' } },
    { word: 'opponent', meanings: ['đối thủ'], example: { en: 'Our opponent is very strong this year.', vi: 'Đối thủ của chúng tôi rất mạnh trong năm nay.' } },
    { word: 'endurance', meanings: ['sức bền', 'sự chịu đựng'], example: { en: 'Marathon runners need great endurance.', vi: 'Người chạy marathon cần sức bền lớn.' } },
    { word: 'referee', meanings: ['trọng tài'], example: { en: 'The referee made a controversial decision.', vi: 'Trọng tài đã đưa ra một quyết định gây tranh cãi.' } },
  ],
  'Tình bạn': [
    { word: 'companion', meanings: ['bạn đồng hành'], example: { en: 'My dog has been a loyal companion for years.', vi: 'Chú chó của tôi đã là người bạn đồng hành trung thành suốt nhiều năm.' } },
    { word: 'loyalty', meanings: ['lòng trung thành'], example: { en: 'Loyalty is an important quality in a friend.', vi: 'Lòng trung thành là một phẩm chất quan trọng ở một người bạn.' } },
    { word: 'trustworthy', meanings: ['đáng tin cậy'], example: { en: 'She is a trustworthy person who keeps her promises.', vi: 'Cô ấy là người đáng tin cậy luôn giữ lời hứa.' } },
    { word: 'generous', meanings: ['hào phóng', 'rộng lượng'], example: { en: 'He is very generous with his time and money.', vi: 'Anh ấy rất hào phóng với thời gian và tiền bạc.' } },
    { word: 'bond', meanings: ['sự gắn kết', 'mối quan hệ'], example: { en: 'We share a special bond that nothing can break.', vi: 'Chúng tôi có một mối quan hệ đặc biệt mà không gì có thể phá vỡ.' } },
    { word: 'reliable', meanings: ['đáng tin cậy'], example: { en: 'I need a reliable friend who will be there for me.', vi: 'Tôi cần một người bạn đáng tin cậy luôn ở bên tôi.' } },
    { word: 'sympathy', meanings: ['sự thông cảm', 'đồng cảm'], example: { en: 'She showed great sympathy when I was going through a hard time.', vi: 'Cô ấy đã thể hiện sự đồng cảm lớn khi tôi trải qua thời gian khó khăn.' } },
    { word: 'quarrel', meanings: ['cãi nhau', 'tranh cãi'], example: { en: 'Friends sometimes quarrel but always make up.', vi: 'Bạn bè đôi khi cãi nhau nhưng luôn làm lành.' } },
    { word: 'childhood', meanings: ['tuổi thơ'], example: { en: 'We have been friends since childhood.', vi: 'Chúng tôi đã là bạn từ thời thơ ấu.' } },
    { word: 'fellowship', meanings: ['tình bạn', 'sự kết giao'], example: { en: 'The fellowship among team members is very strong.', vi: 'Tình bạn giữa các thành viên trong nhóm rất bền chặt.' } },
  ],
  'Tình yêu': [
    { word: 'affection', meanings: ['tình cảm', 'sự yêu mến'], example: { en: 'She shows affection to everyone she cares about.', vi: 'Cô ấy thể hiện tình cảm với tất cả những người cô ấy quan tâm.' } },
    { word: 'devotion', meanings: ['sự tận tâm', 'lòng sùng kính'], example: { en: 'His devotion to his family is truly admirable.', vi: 'Sự tận tâm của anh ấy dành cho gia đình thật đáng ngưỡng mộ.' } },
    { word: 'romantic', meanings: ['lãng mạn'], example: { en: 'They had a romantic dinner by the beach.', vi: 'Họ đã có một bữa tối lãng mạn bên bãi biển.' } },
    { word: 'commitment', meanings: ['cam kết', 'sự ràng buộc'], example: { en: 'Marriage is a lifelong commitment.', vi: 'Hôn nhân là một cam kết trọn đời.' } },
    { word: 'passion', meanings: ['đam mê', 'nhiệt huyết'], example: { en: 'They share a passion for music and art.', vi: 'Họ chia sẻ niềm đam mê âm nhạc và nghệ thuật.' } },
    { word: 'cherish', meanings: ['trân trọng', 'nâng niu'], example: { en: 'I will always cherish the memories we made together.', vi: 'Tôi sẽ luôn trân trọng những kỷ niệm chúng ta đã tạo ra cùng nhau.' } },
    { word: 'adore', meanings: ['yêu quý', 'say đắm'], example: { en: 'He adores his wife and children very much.', vi: 'Anh ấy rất yêu quý vợ và các con.' } },
    { word: 'intimate', meanings: ['thân mật', 'gần gũi'], example: { en: 'They shared an intimate conversation over coffee.', vi: 'Họ đã có một cuộc trò chuyện thân mật bên tách cà phê.' } },
    { word: 'propose', meanings: ['cầu hôn', 'đề nghị'], example: { en: 'He plans to propose to her on her birthday.', vi: 'Anh ấy dự định cầu hôn cô ấy vào ngày sinh nhật.' } },
    { word: 'soulmate', meanings: ['bạn tâm giao', 'người tâm đầu ý hợp'], example: { en: 'She believes she has found her soulmate.', vi: 'Cô ấy tin rằng mình đã tìm được bạn tâm giao.' } },
  ],
  'Sách & Phim ảnh': [
    { word: 'chapter', meanings: ['chương'], example: { en: 'The first chapter of the book is very exciting.', vi: 'Chương đầu tiên của cuốn sách rất hấp dẫn.' } },
    { word: 'plot', meanings: ['cốt truyện'], example: { en: 'The movie has a complex and interesting plot.', vi: 'Bộ phim có cốt truyện phức tạp và thú vị.' } },
    { word: 'character', meanings: ['nhân vật'], example: { en: 'The main character is a young wizard.', vi: 'Nhân vật chính là một phù thủy trẻ.' } },
    { word: 'genre', meanings: ['thể loại'], example: { en: 'My favorite genre is science fiction.', vi: 'Thể loại yêu thích của tôi là khoa học viễn tưởng.' } },
    { word: 'author', meanings: ['tác giả'], example: { en: 'The author has written over twenty novels.', vi: 'Tác giả đã viết hơn hai mươi tiểu thuyết.' } },
    { word: 'screenplay', meanings: ['kịch bản phim'], example: { en: 'The screenplay won an award at the film festival.', vi: 'Kịch bản phim đã giành giải thưởng tại liên hoan phim.' } },
    { word: 'bestseller', meanings: ['sách bán chạy'], example: { en: 'Her new book became an instant bestseller.', vi: 'Cuốn sách mới của cô ấy ngay lập tức trở thành sách bán chạy.' } },
    { word: 'adaptation', meanings: ['sự chuyển thể'], example: { en: 'The film adaptation of the novel was very popular.', vi: 'Bản chuyển thể phim từ tiểu thuyết rất được yêu thích.' } },
    { word: 'climax', meanings: ['cao trào'], example: { en: 'The climax of the story left the audience in suspense.', vi: 'Cao trào của câu chuyện khiến khán giả hồi hộp.' } },
    { word: 'publisher', meanings: ['nhà xuất bản'], example: { en: 'The publisher released the book in multiple languages.', vi: 'Nhà xuất bản đã phát hành cuốn sách bằng nhiều ngôn ngữ.' } },
  ],
  'Âm nhạc': [
    { word: 'melody', meanings: ['giai điệu'], example: { en: 'The melody of this song is very catchy.', vi: 'Giai điệu của bài hát này rất bắt tai.' } },
    { word: 'lyrics', meanings: ['lời bài hát'], example: { en: 'The lyrics of this song are very meaningful.', vi: 'Lời bài hát này rất ý nghĩa.' } },
    { word: 'rhythm', meanings: ['nhịp điệu'], example: { en: 'I love the rhythm of Latin music.', vi: 'Tôi yêu nhịp điệu của nhạc Latin.' } },
    { word: 'concert', meanings: ['buổi hòa nhạc'], example: { en: 'We attended an amazing concert last weekend.', vi: 'Chúng tôi đã tham dự một buổi hòa nhạc tuyệt vời cuối tuần trước.' } },
    { word: 'instrument', meanings: ['nhạc cụ'], example: { en: 'She plays three musical instruments.', vi: 'Cô ấy chơi ba loại nhạc cụ.' } },
    { word: 'composer', meanings: ['nhà soạn nhạc'], example: { en: 'Beethoven is one of the greatest composers.', vi: 'Beethoven là một trong những nhà soạn nhạc vĩ đại nhất.' } },
    { word: 'chorus', meanings: ['điệp khúc', 'hợp xướng'], example: { en: 'The chorus of the song is very easy to sing along to.', vi: 'Điệp khúc của bài hát rất dễ hát theo.' } },
    { word: 'genre', meanings: ['thể loại (nhạc)'], example: { en: 'Jazz is a genre of music that originated in America.', vi: 'Jazz là một thể loại nhạc có nguồn gốc từ Mỹ.' } },
    { word: 'symphony', meanings: ['bản giao hưởng'], example: { en: 'The symphony orchestra performed beautifully.', vi: 'Dàn nhạc giao hưởng đã biểu diễn rất hay.' } },
    { word: 'tune', meanings: ['giai điệu', 'điệu nhạc'], example: { en: 'That tune has been stuck in my head all day.', vi: 'Giai điệu đó cứ văng vẳng trong đầu tôi cả ngày.' } },
  ],
  'Thời trang': [
    { word: 'fashion', meanings: ['thời trang'], example: { en: 'She follows the latest fashion trends.', vi: 'Cô ấy theo dõi các xu hướng thời trang mới nhất.' } },
    { word: 'elegant', meanings: ['thanh lịch'], example: { en: 'She wore an elegant dress to the party.', vi: 'Cô ấy mặc một chiếc váy thanh lịch đến bữa tiệc.' } },
    { word: 'accessory', meanings: ['phụ kiện'], example: { en: 'A scarf is a versatile accessory.', vi: 'Khăn quàng là một phụ kiện đa năng.' } },
    { word: 'outfit', meanings: ['trang phục'], example: { en: 'Your outfit looks very stylish today.', vi: 'Trang phục của bạn trông rất phong cách hôm nay.' } },
    { word: 'trend', meanings: ['xu hướng'], example: { en: 'Minimalist fashion is a big trend this year.', vi: 'Thời trang tối giản là một xu hướng lớn trong năm nay.' } },
    { word: 'wardrobe', meanings: ['tủ quần áo'], example: { en: 'I need to update my wardrobe for the new season.', vi: 'Tôi cần cập nhật tủ quần áo cho mùa mới.' } },
    { word: 'designer', meanings: ['nhà thiết kế'], example: { en: 'She works as a fashion designer in Paris.', vi: 'Cô ấy làm nhà thiết kế thời trang ở Paris.' } },
    { word: 'fabric', meanings: ['vải', 'chất liệu'], example: { en: 'Cotton is a comfortable fabric for summer.', vi: 'Cotton là chất liệu thoải mái cho mùa hè.' } },
    { word: 'stylish', meanings: ['phong cách', 'sành điệu'], example: { en: 'He always looks stylish and well-dressed.', vi: 'Anh ấy luôn trông phong cách và ăn mặc đẹp.' } },
    { word: 'collection', meanings: ['bộ sưu tập'], example: { en: 'The new collection will be launched next month.', vi: 'Bộ sưu tập mới sẽ được ra mắt vào tháng tới.' } },
  ],
}

function getSimulatedSuggestions(topic: string, count: number): SuggestionWord[] {
  const words = SIMULATED_WORDS[topic]
  if (!words) {
    return [
      { word: 'example', meanings: ['ví dụ'], example: { en: 'This is a good example.', vi: 'Đây là một ví dụ tốt.' } },
      { word: 'practice', meanings: ['luyện tập'], example: { en: 'Practice makes perfect.', vi: 'Luyện tập làm nên sự hoàn hảo.' } },
      { word: 'improve', meanings: ['cải thiện'], example: { en: 'I want to improve my English.', vi: 'Tôi muốn cải thiện tiếng Anh của mình.' } },
    ].slice(0, count)
  }
  return words.slice(0, count)
}
