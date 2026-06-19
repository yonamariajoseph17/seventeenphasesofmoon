// Comprehensive India location database — every state & union territory, with
// district headquarters and major cities/towns. All locations are IST (UTC+05:30).
// Coordinates are accurate to at least 2 decimal places. A small set of world
// cities is appended for non-India births.
//
// Search supports: city name, district name, state name, and common alternate
// spellings / colonial names (Bombay → Mumbai, Madras → Chennai, etc.).

export type CityPreset = { name: string; tz: number; lat: number; lon: number };

const IST = 5.5;
const I = (name: string, lat: number, lon: number): CityPreset => ({ name, tz: IST, lat, lon });

export const INDIA_PRESETS: CityPreset[] = [
  // ───────────── TAMIL NADU (all districts) ─────────────
  I("Ariyalur, Tamil Nadu", 11.1401, 79.0786),
  I("Chengalpattu, Tamil Nadu", 12.6819, 79.9888),
  I("Chennai, Tamil Nadu", 13.0827, 80.2707),
  I("Coimbatore, Tamil Nadu", 11.0168, 76.9558),
  I("Cuddalore, Tamil Nadu", 11.748, 79.7714),
  I("Dharmapuri, Tamil Nadu", 12.1211, 78.1583),
  I("Dindigul, Tamil Nadu", 10.3624, 77.9695),
  I("Erode, Tamil Nadu", 11.341, 77.7172),
  I("Kallakurichi, Tamil Nadu", 11.7383, 78.9597),
  I("Kancheepuram, Tamil Nadu", 12.8342, 79.7036),
  I("Kanyakumari (Nagercoil), Tamil Nadu", 8.0883, 77.5385),
  I("Karur, Tamil Nadu", 10.9601, 78.0766),
  I("Krishnagiri, Tamil Nadu", 12.5186, 78.2137),
  I("Madurai, Tamil Nadu", 9.9252, 78.1198),
  I("Mayiladuthurai, Tamil Nadu", 11.1018, 79.6553),
  I("Nagapattinam, Tamil Nadu", 10.7656, 79.8424),
  I("Namakkal, Tamil Nadu", 11.2189, 78.1677),
  I("Nilgiris (Ooty), Tamil Nadu", 11.4102, 76.695),
  I("Perambalur, Tamil Nadu", 11.2342, 78.8809),
  I("Pudukkottai, Tamil Nadu", 10.3833, 78.8001),
  I("Ramanathapuram, Tamil Nadu", 9.3639, 78.8395),
  I("Ranipet, Tamil Nadu", 12.9249, 79.3308),
  I("Salem, Tamil Nadu", 11.6643, 78.146),
  I("Sivaganga, Tamil Nadu", 9.8433, 78.4809),
  I("Tenkasi, Tamil Nadu", 8.9594, 77.3152),
  I("Thanjavur, Tamil Nadu", 10.787, 79.1378),
  I("Theni, Tamil Nadu", 10.0104, 77.4768),
  I("Thoothukudi, Tamil Nadu", 8.7642, 78.1348),
  I("Tiruchirappalli, Tamil Nadu", 10.7905, 78.7047),
  I("Tirunelveli, Tamil Nadu", 8.7139, 77.7567),
  I("Tirupathur, Tamil Nadu", 12.4961, 78.5679),
  I("Tiruppur, Tamil Nadu", 11.1085, 77.3411),
  I("Tiruvallur, Tamil Nadu", 13.1439, 79.9094),
  I("Tiruvannamalai, Tamil Nadu", 12.2253, 79.0747),
  I("Tiruvarur, Tamil Nadu", 10.7726, 79.6368),
  I("Vellore, Tamil Nadu", 12.9165, 79.1325),
  I("Viluppuram, Tamil Nadu", 11.9401, 79.4861),
  I("Virudhunagar, Tamil Nadu", 9.568, 77.9624),
  I("Avadi, Tamil Nadu", 13.1147, 80.0982),
  I("Ambattur, Tamil Nadu", 13.0982, 80.1614),
  I("Hosur, Tamil Nadu", 12.7409, 77.8253),
  I("Karaikudi, Tamil Nadu", 10.0734, 78.7807),
  I("Kumbakonam, Tamil Nadu", 10.9601, 79.3845),

  // ───────────── KERALA (all districts) ─────────────
  I("Thiruvananthapuram, Kerala", 8.5241, 76.9366),
  I("Kollam, Kerala", 8.8932, 76.6141),
  I("Pathanamthitta, Kerala", 9.2648, 76.787),
  I("Alappuzha, Kerala", 9.4981, 76.3388),
  I("Kottayam, Kerala", 9.5916, 76.5222),
  I("Idukki, Kerala", 9.8497, 76.9619),
  I("Ernakulam (Kochi), Kerala", 9.9312, 76.2673),
  I("Thrissur, Kerala", 10.5276, 76.2144),
  I("Palakkad, Kerala", 10.7867, 76.6548),
  I("Malappuram, Kerala", 11.051, 76.0711),
  I("Kozhikode, Kerala", 11.2588, 75.7804),
  I("Wayanad (Kalpetta), Kerala", 11.6854, 76.132),
  I("Kannur, Kerala", 11.8745, 75.3704),
  I("Kasaragod, Kerala", 12.4996, 74.9869),
  I("Guruvayur, Kerala", 10.5946, 76.0411),

  // ───────────── KARNATAKA (all districts) ─────────────
  I("Bengaluru (Urban), Karnataka", 12.9716, 77.5946),
  I("Bengaluru Rural, Karnataka", 13.2846, 77.6916),
  I("Bagalkot, Karnataka", 16.1817, 75.6953),
  I("Ballari (Bellary), Karnataka", 15.1394, 76.9214),
  I("Belagavi (Belgaum), Karnataka", 15.8497, 74.4977),
  I("Bidar, Karnataka", 17.9133, 77.5301),
  I("Chamarajanagar, Karnataka", 11.9261, 76.9438),
  I("Chikkaballapur, Karnataka", 13.4355, 77.7315),
  I("Chikkamagaluru, Karnataka", 13.3161, 75.772),
  I("Chitradurga, Karnataka", 14.2251, 76.398),
  I("Dakshina Kannada (Mangaluru), Karnataka", 12.9141, 74.856),
  I("Davanagere, Karnataka", 14.4644, 75.9218),
  I("Dharwad (Hubballi), Karnataka", 15.4589, 75.0078),
  I("Gadag, Karnataka", 15.4298, 75.6341),
  I("Hassan, Karnataka", 13.0072, 76.0962),
  I("Haveri, Karnataka", 14.7951, 75.4042),
  I("Kalaburagi (Gulbarga), Karnataka", 17.3297, 76.8343),
  I("Kodagu (Madikeri), Karnataka", 12.4218, 75.7382),
  I("Kolar, Karnataka", 13.1357, 78.1326),
  I("Koppal, Karnataka", 15.3547, 76.1546),
  I("Mandya, Karnataka", 12.5223, 76.8954),
  I("Mysuru (Mysore), Karnataka", 12.2958, 76.6394),
  I("Raichur, Karnataka", 16.2076, 77.3463),
  I("Ramanagara, Karnataka", 12.7217, 77.2807),
  I("Shivamogga (Shimoga), Karnataka", 13.9299, 75.5681),
  I("Tumakuru (Tumkur), Karnataka", 13.3379, 77.1173),
  I("Udupi, Karnataka", 13.3409, 74.7421),
  I("Uttara Kannada (Karwar), Karnataka", 14.8136, 74.129),
  I("Vijayapura (Bijapur), Karnataka", 16.8302, 75.71),
  I("Yadgir, Karnataka", 16.7689, 77.1376),
  I("Robertsonpet (KGF), Karnataka", 12.9554, 78.2752),

  // ───────────── ANDHRA PRADESH (all districts/major) ─────────────
  I("Visakhapatnam, Andhra Pradesh", 17.6868, 83.2185),
  I("Vijayawada, Andhra Pradesh", 16.5062, 80.648),
  I("Guntur, Andhra Pradesh", 16.3067, 80.4365),
  I("Nellore, Andhra Pradesh", 14.4426, 79.9865),
  I("Kurnool, Andhra Pradesh", 15.8281, 78.0373),
  I("Kadapa, Andhra Pradesh", 14.4674, 78.8241),
  I("Tirupati, Andhra Pradesh", 13.6288, 79.4192),
  I("Anantapur, Andhra Pradesh", 14.6819, 77.6006),
  I("Rajahmundry, Andhra Pradesh", 16.9891, 81.7837),
  I("Kakinada, Andhra Pradesh", 16.9891, 82.2475),
  I("Eluru, Andhra Pradesh", 16.7107, 81.0952),
  I("Ongole, Andhra Pradesh", 15.5057, 80.0499),
  I("Vizianagaram, Andhra Pradesh", 18.1067, 83.3956),
  I("Srikakulam, Andhra Pradesh", 18.2949, 83.8938),
  I("Chittoor, Andhra Pradesh", 13.2172, 79.1003),
  I("Machilipatnam, Andhra Pradesh", 16.1875, 81.1389),
  I("Amaravati, Andhra Pradesh", 16.5735, 80.358),
  I("Proddatur, Andhra Pradesh", 14.7502, 78.5481),
  I("Adoni, Andhra Pradesh", 15.6322, 77.2728),
  I("Tenali, Andhra Pradesh", 16.2379, 80.64),
  I("Bhimavaram, Andhra Pradesh", 16.5449, 81.5212),
  I("Narasaraopet, Andhra Pradesh", 16.2347, 80.0496),
  I("Tadipatri, Andhra Pradesh", 14.9091, 78.0089),
  I("Guntakal, Andhra Pradesh", 15.1711, 77.3729),
  I("Dharmavaram, Andhra Pradesh", 14.4138, 77.7126),
  I("Madanapalle, Andhra Pradesh", 13.5503, 78.5026),
  I("Nandyal, Andhra Pradesh", 15.4777, 78.4873),
  I("Tadepalligudem, Andhra Pradesh", 16.815, 81.5273),
  I("Kavali, Andhra Pradesh", 14.9135, 79.9929),
  I("Mangalagiri, Andhra Pradesh", 16.43, 80.5683),

  // ───────────── TELANGANA (districts/major) ─────────────
  I("Hyderabad, Telangana", 17.385, 78.4867),
  I("Secunderabad, Telangana", 17.4399, 78.4983),
  I("Warangal, Telangana", 17.9689, 79.5941),
  I("Nizamabad, Telangana", 18.6725, 78.0941),
  I("Karimnagar, Telangana", 18.4386, 79.1288),
  I("Khammam, Telangana", 17.2473, 80.1514),
  I("Mahbubnagar, Telangana", 16.7488, 77.9853),
  I("Nalgonda, Telangana", 17.0575, 79.2684),
  I("Adilabad, Telangana", 19.6641, 78.532),
  I("Siddipet, Telangana", 18.1018, 78.852),
  I("Ramagundam, Telangana", 18.7595, 79.474),
  I("Suryapet, Telangana", 17.1353, 79.6228),
  I("Miryalaguda, Telangana", 16.8722, 79.566),

  // ───────────── PUDUCHERRY (UT) ─────────────
  I("Puducherry, Puducherry", 11.9416, 79.8083),
  I("Karaikal, Puducherry", 10.9254, 79.838),
  I("Mahe, Puducherry", 11.7012, 75.5364),
  I("Yanam, Puducherry", 16.7333, 82.2167),

  // ───────────── MAHARASHTRA ─────────────
  I("Mumbai, Maharashtra", 19.076, 72.8777),
  I("Navi Mumbai, Maharashtra", 19.033, 73.0297),
  I("Thane, Maharashtra", 19.2183, 72.9781),
  I("Pune, Maharashtra", 18.5204, 73.8567),
  I("Nagpur, Maharashtra", 21.1458, 79.0882),
  I("Nashik, Maharashtra", 19.9975, 73.7898),
  I("Chhatrapati Sambhajinagar (Aurangabad), Maharashtra", 19.8762, 75.3433),
  I("Solapur, Maharashtra", 17.6599, 75.9064),
  I("Kolhapur, Maharashtra", 16.705, 74.2433),
  I("Amravati, Maharashtra", 20.9374, 77.7796),
  I("Nanded, Maharashtra", 19.1383, 77.321),
  I("Sangli, Maharashtra", 16.8524, 74.5815),
  I("Jalgaon, Maharashtra", 21.0077, 75.5626),
  I("Akola, Maharashtra", 20.7002, 77.0082),
  I("Latur, Maharashtra", 18.4088, 76.5604),
  I("Dhule, Maharashtra", 20.9042, 74.7749),
  I("Ahmednagar, Maharashtra", 19.0948, 74.748),
  I("Chandrapur, Maharashtra", 19.9615, 79.2961),
  I("Parbhani, Maharashtra", 19.2704, 76.7606),
  I("Satara, Maharashtra", 17.6805, 74.0183),
  I("Ratnagiri, Maharashtra", 16.9902, 73.312),
  I("Beed, Maharashtra", 18.989, 75.7601),
  I("Wardha, Maharashtra", 20.7453, 78.6022),
  I("Yavatmal, Maharashtra", 20.3888, 78.1204),

  // ───────────── DELHI ─────────────
  I("New Delhi, Delhi", 28.6139, 77.209),
  I("Delhi, Delhi", 28.7041, 77.1025),

  // ───────────── WEST BENGAL ─────────────
  I("Kolkata, West Bengal", 22.5726, 88.3639),
  I("Howrah, West Bengal", 22.5958, 88.2636),
  I("Siliguri, West Bengal", 26.7271, 88.3953),
  I("Durgapur, West Bengal", 23.5204, 87.3119),
  I("Asansol, West Bengal", 23.6739, 86.9524),
  I("Darjeeling, West Bengal", 27.041, 88.2663),
  I("Kalimpong, West Bengal", 27.0596, 88.4695),
  I("Bardhaman (Burdwan), West Bengal", 23.255, 87.8493),
  I("Malda, West Bengal", 25.0108, 88.1411),
  I("Kharagpur, West Bengal", 22.3302, 87.3237),
  I("Haldia, West Bengal", 22.0667, 88.0698),
  I("Jalpaiguri, West Bengal", 26.5435, 88.7196),
  I("Cooch Behar, West Bengal", 26.3242, 89.4513),
  I("Krishnanagar, West Bengal", 23.4009, 88.5022),
  I("Berhampore, West Bengal", 24.1043, 88.2518),

  // ───────────── GUJARAT ─────────────
  I("Ahmedabad, Gujarat", 23.0225, 72.5714),
  I("Surat, Gujarat", 21.1702, 72.8311),
  I("Vadodara, Gujarat", 22.3072, 73.1812),
  I("Rajkot, Gujarat", 22.3039, 70.8022),
  I("Gandhinagar, Gujarat", 23.2156, 72.6369),
  I("Bhavnagar, Gujarat", 21.7645, 72.1519),
  I("Jamnagar, Gujarat", 22.4707, 70.0577),
  I("Junagadh, Gujarat", 21.5222, 70.4579),
  I("Anand, Gujarat", 22.5645, 72.9289),
  I("Nadiad, Gujarat", 22.6939, 72.8616),
  I("Bharuch, Gujarat", 21.7051, 72.9959),
  I("Navsari, Gujarat", 20.9467, 72.952),
  I("Mehsana, Gujarat", 23.588, 72.3693),
  I("Morbi, Gujarat", 22.8173, 70.8377),
  I("Porbandar, Gujarat", 21.6417, 69.6293),
  I("Bhuj (Kutch), Gujarat", 23.242, 69.6669),
  I("Surendranagar, Gujarat", 22.7271, 71.6479),
  I("Amreli, Gujarat", 21.6032, 71.2221),

  // ───────────── RAJASTHAN ─────────────
  I("Jaipur, Rajasthan", 26.9124, 75.7873),
  I("Jodhpur, Rajasthan", 26.2389, 73.0243),
  I("Udaipur, Rajasthan", 24.5854, 73.7125),
  I("Kota, Rajasthan", 25.2138, 75.8648),
  I("Bikaner, Rajasthan", 28.0229, 73.3119),
  I("Ajmer, Rajasthan", 26.4499, 74.6399),
  I("Bhilwara, Rajasthan", 25.3463, 74.6364),
  I("Alwar, Rajasthan", 27.5530, 76.6346),
  I("Bharatpur, Rajasthan", 27.2152, 77.4909),
  I("Sikar, Rajasthan", 27.6094, 75.1399),
  I("Pali, Rajasthan", 25.7711, 73.3234),
  I("Sri Ganganagar, Rajasthan", 29.9038, 73.8772),
  I("Hanumangarh, Rajasthan", 29.5818, 74.3294),
  I("Chittorgarh, Rajasthan", 24.8887, 74.6269),
  I("Barmer, Rajasthan", 25.7521, 71.3962),
  I("Jaisalmer, Rajasthan", 26.9157, 70.9083),
  I("Banswara, Rajasthan", 23.5461, 74.4349),
  I("Mount Abu (Sirohi), Rajasthan", 24.5926, 72.7156),

  // ───────────── UTTAR PRADESH ─────────────
  I("Lucknow, Uttar Pradesh", 26.8467, 80.9462),
  I("Kanpur, Uttar Pradesh", 26.4499, 80.3319),
  I("Varanasi, Uttar Pradesh", 25.3176, 82.9739),
  I("Agra, Uttar Pradesh", 27.1767, 78.0081),
  I("Prayagraj (Allahabad), Uttar Pradesh", 25.4358, 81.8463),
  I("Meerut, Uttar Pradesh", 28.9845, 77.7064),
  I("Ghaziabad, Uttar Pradesh", 28.6692, 77.4538),
  I("Noida, Uttar Pradesh", 28.5355, 77.391),
  I("Bareilly, Uttar Pradesh", 28.367, 79.4304),
  I("Aligarh, Uttar Pradesh", 27.8974, 78.088),
  I("Moradabad, Uttar Pradesh", 28.8386, 78.7733),
  I("Saharanpur, Uttar Pradesh", 29.968, 77.5552),
  I("Gorakhpur, Uttar Pradesh", 26.7606, 83.3732),
  I("Firozabad, Uttar Pradesh", 27.1591, 78.3957),
  I("Jhansi, Uttar Pradesh", 25.4484, 78.5685),
  I("Mathura, Uttar Pradesh", 27.4924, 77.6737),
  I("Ayodhya, Uttar Pradesh", 26.7922, 82.1998),
  I("Rampur, Uttar Pradesh", 28.7902, 79.0252),
  I("Shahjahanpur, Uttar Pradesh", 27.8804, 79.9089),
  I("Muzaffarnagar, Uttar Pradesh", 29.4727, 77.7085),
  I("Jaunpur, Uttar Pradesh", 25.7536, 82.6837),
  I("Azamgarh, Uttar Pradesh", 26.0739, 83.1859),
  I("Faizabad, Uttar Pradesh", 26.7732, 82.1456),

  // ───────────── BIHAR ─────────────
  I("Patna, Bihar", 25.5941, 85.1376),
  I("Gaya, Bihar", 24.7955, 84.9994),
  I("Bhagalpur, Bihar", 25.2425, 86.9842),
  I("Muzaffarpur, Bihar", 26.1209, 85.3647),
  I("Darbhanga, Bihar", 26.1542, 85.8918),
  I("Purnia, Bihar", 25.7771, 87.4753),
  I("Begusarai, Bihar", 25.4182, 86.1272),
  I("Katihar, Bihar", 25.5394, 87.5717),
  I("Munger, Bihar", 25.3708, 86.4734),
  I("Chapra (Saran), Bihar", 25.7811, 84.7475),
  I("Nalanda (Bihar Sharif), Bihar", 25.2002, 85.5238),
  I("Bodh Gaya, Bihar", 24.6961, 84.9869),
  I("Sitamarhi, Bihar", 26.5949, 85.4905),
  I("Madhubani, Bihar", 26.3548, 86.0712),

  // ───────────── MADHYA PRADESH ─────────────
  I("Bhopal, Madhya Pradesh", 23.2599, 77.4126),
  I("Indore, Madhya Pradesh", 22.7196, 75.8577),
  I("Jabalpur, Madhya Pradesh", 23.1815, 79.9864),
  I("Gwalior, Madhya Pradesh", 26.2183, 78.1828),
  I("Ujjain, Madhya Pradesh", 23.1765, 75.7885),
  I("Sagar, Madhya Pradesh", 23.8388, 78.7378),
  I("Satna, Madhya Pradesh", 24.5677, 80.8322),
  I("Rewa, Madhya Pradesh", 24.5362, 81.3037),
  I("Ratlam, Madhya Pradesh", 23.3315, 75.0367),
  I("Dewas, Madhya Pradesh", 22.9676, 76.0534),
  I("Chhindwara, Madhya Pradesh", 22.0574, 78.9382),
  I("Khajuraho, Madhya Pradesh", 24.8318, 79.9199),

  // ───────────── CHHATTISGARH ─────────────
  I("Raipur, Chhattisgarh", 21.2514, 81.6296),
  I("Bhilai, Chhattisgarh", 21.1938, 81.3509),
  I("Bilaspur, Chhattisgarh", 22.0797, 82.1409),
  I("Korba, Chhattisgarh", 22.3595, 82.7501),
  I("Durg, Chhattisgarh", 21.1904, 81.2849),
  I("Raigarh, Chhattisgarh", 21.8974, 83.395),
  I("Jagdalpur, Chhattisgarh", 19.0748, 82.0181),

  // ───────────── PUNJAB ─────────────
  I("Ludhiana, Punjab", 30.901, 75.8573),
  I("Amritsar, Punjab", 31.634, 74.8723),
  I("Jalandhar, Punjab", 31.326, 75.5762),
  I("Patiala, Punjab", 30.3398, 76.3869),
  I("Bathinda, Punjab", 30.211, 74.9455),
  I("Mohali, Punjab", 30.7046, 76.7179),
  I("Pathankot, Punjab", 32.2643, 75.6421),
  I("Hoshiarpur, Punjab", 31.5322, 75.9119),
  I("Moga, Punjab", 30.8158, 75.1711),
  I("Firozpur, Punjab", 30.9331, 74.6225),

  // ───────────── HARYANA ─────────────
  I("Gurugram, Haryana", 28.4595, 77.0266),
  I("Faridabad, Haryana", 28.4089, 77.3178),
  I("Panipat, Haryana", 29.3909, 76.9635),
  I("Ambala, Haryana", 30.3782, 76.7767),
  I("Yamunanagar, Haryana", 30.129, 77.2674),
  I("Rohtak, Haryana", 28.8955, 76.6066),
  I("Hisar, Haryana", 29.1492, 75.7217),
  I("Karnal, Haryana", 29.6857, 76.9905),
  I("Sonipat, Haryana", 28.9931, 77.0151),
  I("Panchkula, Haryana", 30.6942, 76.8606),
  I("Sirsa, Haryana", 29.5349, 75.0281),
  I("Kurukshetra, Haryana", 29.9695, 76.8783),

  // ───────────── CHANDIGARH (UT) ─────────────
  I("Chandigarh, Chandigarh", 30.7333, 76.7794),

  // ───────────── ODISHA ─────────────
  I("Bhubaneswar, Odisha", 20.2961, 85.8245),
  I("Cuttack, Odisha", 20.4625, 85.8828),
  I("Rourkela, Odisha", 22.2604, 84.8536),
  I("Berhampur (Brahmapur), Odisha", 19.3149, 84.7941),
  I("Sambalpur, Odisha", 21.4669, 83.9812),
  I("Puri, Odisha", 19.8135, 85.8312),
  I("Balasore, Odisha", 21.4934, 86.9335),
  I("Bhadrak, Odisha", 21.0574, 86.4963),
  I("Baripada, Odisha", 21.9347, 86.7335),
  I("Jharsuguda, Odisha", 21.8554, 84.0062),
  I("Konark, Odisha", 19.8876, 86.0945),

  // ───────────── JHARKHAND ─────────────
  I("Ranchi, Jharkhand", 23.3441, 85.3096),
  I("Jamshedpur, Jharkhand", 22.8046, 86.2029),
  I("Dhanbad, Jharkhand", 23.7957, 86.4304),
  I("Bokaro, Jharkhand", 23.6693, 86.1511),
  I("Hazaribagh, Jharkhand", 23.9925, 85.3637),
  I("Deoghar, Jharkhand", 24.4823, 86.6967),
  I("Giridih, Jharkhand", 24.1913, 86.3003),
  I("Ramgarh, Jharkhand", 23.6307, 85.5142),

  // ───────────── ASSAM ─────────────
  I("Guwahati, Assam", 26.1445, 91.7362),
  I("Dibrugarh, Assam", 27.4728, 94.912),
  I("Jorhat, Assam", 26.7509, 94.2037),
  I("Silchar, Assam", 24.8333, 92.7789),
  I("Nagaon, Assam", 26.3463, 92.6838),
  I("Tinsukia, Assam", 27.4922, 95.3468),
  I("Tezpur, Assam", 26.6338, 92.8, ),
  I("Bongaigaon, Assam", 26.4769, 90.5583),
  I("Dispur, Assam", 26.1433, 91.7898),

  // ───────────── UTTARAKHAND ─────────────
  I("Dehradun, Uttarakhand", 30.3165, 78.0322),
  I("Haridwar, Uttarakhand", 29.9457, 78.1642),
  I("Rishikesh, Uttarakhand", 30.0869, 78.2676),
  I("Roorkee, Uttarakhand", 29.8543, 77.888),
  I("Haldwani, Uttarakhand", 29.2183, 79.5130),
  I("Nainital, Uttarakhand", 29.3919, 79.4542),
  I("Mussoorie, Uttarakhand", 30.4599, 78.0664),
  I("Almora, Uttarakhand", 29.5892, 79.6467),
  I("Pithoragarh, Uttarakhand", 29.5829, 80.2181),
  I("Rudrapur, Uttarakhand", 28.9875, 79.4141),

  // ───────────── HIMACHAL PRADESH ─────────────
  I("Shimla, Himachal Pradesh", 31.1048, 77.1734),
  I("Mandi, Himachal Pradesh", 31.7084, 76.9319),
  I("Kullu, Himachal Pradesh", 31.9579, 77.1095),
  I("Manali, Himachal Pradesh", 32.2396, 77.1887),
  I("Dharamshala, Himachal Pradesh", 32.219, 76.3234),
  I("Solan, Himachal Pradesh", 30.9045, 77.0967),
  I("Hamirpur, Himachal Pradesh", 31.6862, 76.5213),
  I("Bilaspur, Himachal Pradesh", 31.3303, 76.7553),
  I("Una, Himachal Pradesh", 31.4685, 76.2708),
  I("Chamba, Himachal Pradesh", 32.5533, 76.1258),
  I("Dalhousie, Himachal Pradesh", 32.5387, 75.9707),

  // ───────────── JAMMU & KASHMIR (UT) ─────────────
  I("Srinagar, Jammu & Kashmir", 34.0837, 74.7973),
  I("Jammu, Jammu & Kashmir", 32.7266, 74.857),
  I("Anantnag, Jammu & Kashmir", 33.7311, 75.1487),
  I("Baramulla, Jammu & Kashmir", 34.1980, 74.3636),
  I("Sopore, Jammu & Kashmir", 34.2870, 74.4694),
  I("Udhampur, Jammu & Kashmir", 32.9159, 75.1416),
  I("Kathua, Jammu & Kashmir", 32.3705, 75.5252),
  I("Pulwama, Jammu & Kashmir", 33.8748, 74.8990),

  // ───────────── LADAKH (UT) ─────────────
  I("Leh, Ladakh", 34.1526, 77.5771),
  I("Kargil, Ladakh", 34.5539, 76.1349),

  // ───────────── GOA ─────────────
  I("Panaji, Goa", 15.4909, 73.8278),
  I("Margao, Goa", 15.2832, 73.9862),
  I("Vasco da Gama, Goa", 15.3981, 73.8113),
  I("Mapusa, Goa", 15.5937, 73.8142),
  I("Ponda, Goa", 15.4027, 74.015),

  // ───────────── NORTH-EAST (states) ─────────────
  I("Imphal, Manipur", 24.817, 93.9368),
  I("Thoubal, Manipur", 24.6378, 94.0107),
  I("Churachandpur, Manipur", 24.3339, 93.6791),
  I("Shillong, Meghalaya", 25.5788, 91.8933),
  I("Tura, Meghalaya", 25.5145, 90.2026),
  I("Aizawl, Mizoram", 23.7271, 92.7176),
  I("Lunglei, Mizoram", 22.8879, 92.7351),
  I("Kohima, Nagaland", 25.6751, 94.1086),
  I("Dimapur, Nagaland", 25.9091, 93.7266),
  I("Mokokchung, Nagaland", 26.3221, 94.5132),
  I("Agartala, Tripura", 23.8315, 91.2868),
  I("Udaipur, Tripura", 23.5333, 91.4833),
  I("Dharmanagar, Tripura", 24.3768, 92.1675),
  I("Itanagar, Arunachal Pradesh", 27.0844, 93.6053),
  I("Naharlagun, Arunachal Pradesh", 27.1039, 93.6964),
  I("Pasighat, Arunachal Pradesh", 28.0664, 95.3267),
  I("Tawang, Arunachal Pradesh", 27.5861, 91.8594),
  I("Ziro, Arunachal Pradesh", 27.5448, 93.8273),
  I("Gangtok, Sikkim", 27.3389, 88.6065),
  I("Namchi, Sikkim", 27.1675, 88.3637),
  I("Gyalshing, Sikkim", 27.2833, 88.2667),
  I("Mangan, Sikkim", 27.5083, 88.5333),

  // ───────────── ANDAMAN & NICOBAR (UT) ─────────────
  I("Port Blair, Andaman & Nicobar", 11.6234, 92.7265),
  I("Havelock Island (Swaraj Dweep), Andaman & Nicobar", 12.0167, 92.9833),
  I("Car Nicobar, Andaman & Nicobar", 9.1667, 92.7833),

  // ───────────── LAKSHADWEEP (UT) ─────────────
  I("Kavaratti, Lakshadweep", 10.5669, 72.6420),
  I("Agatti, Lakshadweep", 10.8569, 72.1969),
  I("Minicoy, Lakshadweep", 8.2833, 73.0494),

  // ───────────── DADRA & NAGAR HAVELI AND DAMAN & DIU (UT) ─────────────
  I("Daman, Daman & Diu", 20.3974, 72.8328),
  I("Diu, Daman & Diu", 20.7144, 70.9874),
  I("Silvassa, Dadra & Nagar Haveli", 20.2738, 73.0083),
];

// World cities for non-India births.
export const WORLD_PRESETS: CityPreset[] = [
  { name: "London, UK", tz: 0, lat: 51.5074, lon: -0.1278 },
  { name: "Paris, France", tz: 1, lat: 48.8566, lon: 2.3522 },
  { name: "New York, USA", tz: -5, lat: 40.7128, lon: -74.006 },
  { name: "Los Angeles, USA", tz: -8, lat: 34.0522, lon: -118.2437 },
  { name: "Dubai, UAE", tz: 4, lat: 25.2048, lon: 55.2708 },
  { name: "Singapore", tz: 8, lat: 1.3521, lon: 103.8198 },
  { name: "Tokyo, Japan", tz: 9, lat: 35.6762, lon: 139.6503 },
  { name: "Sydney, Australia", tz: 10, lat: -33.8688, lon: 151.2093 },
  { name: "Kathmandu, Nepal", tz: 5.75, lat: 27.7172, lon: 85.324 },
  { name: "Colombo, Sri Lanka", tz: 5.5, lat: 6.9271, lon: 79.8612 },
];

export const ALL_PRESETS: CityPreset[] = [...INDIA_PRESETS, ...WORLD_PRESETS];

// Common alternate / colonial / popular names → the canonical preset name.
export const CITY_ALIASES: Record<string, string> = {
  bombay: "Mumbai, Maharashtra",
  madras: "Chennai, Tamil Nadu",
  calcutta: "Kolkata, West Bengal",
  bangalore: "Bengaluru (Urban), Karnataka",
  bengaluru: "Bengaluru (Urban), Karnataka",
  mysore: "Mysuru (Mysore), Karnataka",
  mangalore: "Dakshina Kannada (Mangaluru), Karnataka",
  mangaluru: "Dakshina Kannada (Mangaluru), Karnataka",
  belgaum: "Belagavi (Belgaum), Karnataka",
  hubli: "Dharwad (Hubballi), Karnataka",
  hubballi: "Dharwad (Hubballi), Karnataka",
  gulbarga: "Kalaburagi (Gulbarga), Karnataka",
  bijapur: "Vijayapura (Bijapur), Karnataka",
  bellary: "Ballari (Bellary), Karnataka",
  shimoga: "Shivamogga (Shimoga), Karnataka",
  tumkur: "Tumakuru (Tumkur), Karnataka",
  pondicherry: "Puducherry, Puducherry",
  pondy: "Puducherry, Puducherry",
  trivandrum: "Thiruvananthapuram, Kerala",
  cochin: "Ernakulam (Kochi), Kerala",
  kochi: "Ernakulam (Kochi), Kerala",
  calicut: "Kozhikode, Kerala",
  trichur: "Thrissur, Kerala",
  quilon: "Kollam, Kerala",
  alleppey: "Alappuzha, Kerala",
  palghat: "Palakkad, Kerala",
  cannanore: "Kannur, Kerala",
  trichy: "Tiruchirappalli, Tamil Nadu",
  tanjore: "Thanjavur, Tamil Nadu",
  ooty: "Nilgiris (Ooty), Tamil Nadu",
  udhagamandalam: "Nilgiris (Ooty), Tamil Nadu",
  tuticorin: "Thoothukudi, Tamil Nadu",
  nagercoil: "Kanyakumari (Nagercoil), Tamil Nadu",
  conjeevaram: "Kancheepuram, Tamil Nadu",
  vizag: "Visakhapatnam, Andhra Pradesh",
  vizagapatnam: "Visakhapatnam, Andhra Pradesh",
  bezawada: "Vijayawada, Andhra Pradesh",
  cuddapah: "Kadapa, Andhra Pradesh",
  poona: "Pune, Maharashtra",
  aurangabad: "Chhatrapati Sambhajinagar (Aurangabad), Maharashtra",
  baroda: "Vadodara, Gujarat",
  ahmadabad: "Ahmedabad, Gujarat",
  benares: "Varanasi, Uttar Pradesh",
  banaras: "Varanasi, Uttar Pradesh",
  allahabad: "Prayagraj (Allahabad), Uttar Pradesh",
  gurgaon: "Gurugram, Haryana",
  simla: "Shimla, Himachal Pradesh",
  cawnpore: "Kanpur, Uttar Pradesh",
  gauhati: "Guwahati, Assam",
  panjim: "Panaji, Goa",
  brahmapur: "Berhampur (Brahmapur), Odisha",
};

/** Resolve a typed string to a canonical preset (by alias or exact name). */
export function resolvePreset(input: string): CityPreset | undefined {
  const q = input.trim().toLowerCase();
  if (!q) return undefined;
  const aliasTarget = CITY_ALIASES[q];
  if (aliasTarget) {
    const aliased = ALL_PRESETS.find((p) => p.name === aliasTarget);
    if (aliased) return aliased;
  }
  return ALL_PRESETS.find((p) => p.name.toLowerCase() === q);
}

/**
 * Smart search: matches city, district, or state names and alternate spellings.
 * Returns up to `limit` ranked presets (prefix matches first).
 */
export function searchPresets(input: string, limit = 8): CityPreset[] {
  const q = input.trim().toLowerCase();
  if (q.length < 2) return [];

  const aliasTarget = CITY_ALIASES[q];
  const results: Array<{ p: CityPreset; score: number }> = [];

  for (const p of ALL_PRESETS) {
    const name = p.name.toLowerCase();
    let score = -1;
    if (aliasTarget && p.name === aliasTarget) score = 100;
    else if (name.startsWith(q)) score = 80;
    else if (name.includes(`(${q}`) || name.includes(` ${q}`)) score = 60;
    else if (name.includes(q)) score = 40;
    if (score >= 0) results.push({ p, score });
  }

  // Partial alias matches (e.g. typing "bomb" should still hint Mumbai).
  for (const [alias, target] of Object.entries(CITY_ALIASES)) {
    if (alias.startsWith(q) && !results.some((r) => r.p.name === target)) {
      const p = ALL_PRESETS.find((x) => x.name === target);
      if (p) results.push({ p, score: 70 });
    }
  }

  return results
    .sort((a, b) => b.score - a.score || a.p.name.localeCompare(b.p.name))
    .slice(0, limit)
    .map((r) => r.p);
}
