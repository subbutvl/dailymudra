import type { MudraId } from './mudras';
import type { Lang } from '@/i18n/strings';

/**
 * Help content: how to practice, when to practice, and a short wiki per mudra.
 * Phrased as traditional guidance, never medical claims. Tamil is machine-drafted;
 * review with a native speaker.
 */

export interface HelpSection {
  title: string;
  /** Numbered steps (how) or bullet points (when / tips). */
  items: string[];
  numbered?: boolean;
}

export interface WikiEntry {
  overview: string;
  elements: string;
  bestTime: string;
  duration: string;
  tips: string;
}

export const HOW_TO: Record<Lang, HelpSection[]> = {
  en: [
    {
      title: 'Step by step',
      numbered: true,
      items: [
        'Find a quiet spot. Sit on a chair with your feet flat, or cross-legged on the floor. Keep your back upright but relaxed.',
        'Rest your hands on your thighs or knees, palms facing up, shoulders soft.',
        'Form the mudra with both hands. The touch is light, like holding a feather. Fingers that are not part of the gesture stay relaxed and extended.',
        'Keep your eyes softly on the gesture, or close them. Breathe slowly through the nose and follow the breathing ring: in for 4 seconds, out for 6.',
        'Hold for the time you chose. If your hand tires, release, shake it out gently and form the mudra again.',
        'When the session ends, release slowly and sit for a moment before you get up.',
      ],
    },
    {
      title: 'Good habits',
      items: [
        'Practice on an empty or light stomach, in comfortable clothes.',
        'Never force the fingers. Gentle contact is enough.',
        'A little every day matters more than long sessions. That is why the app tracks your streak.',
        'Mudras are a complementary practice, not a substitute for medical care.',
      ],
    },
  ],
  ta: [
    {
      title: 'படிப்படியாக',
      numbered: true,
      items: [
        'அமைதியான இடத்தைத் தேர்ந்தெடுங்கள். நாற்காலியில் பாதங்களைத் தரையில் வைத்து, அல்லது தரையில் சம்மணமிட்டு அமருங்கள். முதுகை நிமிர்த்தி, தளர்வாக வையுங்கள்.',
        'உள்ளங்கைகள் மேல்நோக்கி இருக்கும்படி கைகளைத் தொடைகள் அல்லது முழங்கால்களின் மீது வையுங்கள். தோள்களைத் தளர்த்துங்கள்.',
        'இரு கைகளிலும் முத்திரையை அமையுங்கள். இறகைத் தொடுவது போல மென்மையாகத் தொடுங்கள். முத்திரையில் பங்கேற்காத விரல்கள் தளர்வாக நீட்டியபடி இருக்கட்டும்.',
        'கண்களை முத்திரையின் மீது மென்மையாக வையுங்கள், அல்லது மூடிக்கொள்ளுங்கள். மூக்கின் வழியாக மெதுவாக மூச்சு விட்டு, மூச்சு வளையத்தைப் பின்பற்றுங்கள்: 4 வினாடி உள்ளே, 6 வினாடி வெளியே.',
        'நீங்கள் தேர்ந்தெடுத்த நேரம் வரை தொடருங்கள். கை சோர்ந்தால், விடுவித்து, மெதுவாக உதறி, மீண்டும் முத்திரையை அமையுங்கள்.',
        'அமர்வு முடிந்ததும், மெதுவாக விடுவித்து, எழுவதற்கு முன் ஒரு கணம் அமர்ந்திருங்கள்.',
      ],
    },
    {
      title: 'நல்ல பழக்கங்கள்',
      items: [
        'வெறும் வயிற்றில் அல்லது லேசான உணவுக்குப் பின், வசதியான உடையில் பயிற்சி செய்யுங்கள்.',
        'விரல்களை ஒருபோதும் அழுத்தி வற்புறுத்தாதீர்கள். மென்மையான தொடுதல் போதும்.',
        'நீண்ட அமர்வுகளை விட தினமும் சிறிது பயிற்சி செய்வதே முக்கியம். அதனால்தான் செயலி உங்கள் தொடர் நாட்களைக் கணக்கிடுகிறது.',
        'முத்திரைகள் ஒரு துணைப் பயிற்சி மட்டுமே, மருத்துவ சிகிச்சைக்கு மாற்று அல்ல.',
      ],
    },
  ],
};

export const WHEN_TO: Record<Lang, HelpSection[]> = {
  en: [
    {
      title: 'Times of day',
      items: [
        'Morning, after waking and before breakfast, when the mind is fresh. A good time for Gyan and Prana.',
        'Before study or work: a few minutes of Gyan to settle attention.',
        'After meals: Apana is traditionally practiced after eating. For the others, wait about 30 minutes after a large meal.',
        'Evening: wind down with Gyan. If Prana feels energising, practice it earlier in the day.',
        'When needed: Vayu or Shunya in short sessions when you feel restless or heavy-headed, only until you feel at ease.',
      ],
    },
    {
      title: 'How long',
      items: [
        'Start with 3 to 5 minutes and build up to 10 or 15.',
        'Several short sessions in a day are as good as one long one.',
        'Use the custom timer (− / +) for any length from 1 to 60 minutes.',
      ],
    },
  ],
  ta: [
    {
      title: 'நாளின் நேரங்கள்',
      items: [
        'காலையில், எழுந்தவுடன் காலை உணவுக்கு முன், மனம் புத்துணர்வுடன் இருக்கும்போது. ஞான, பிராண முத்திரைகளுக்கு ஏற்ற நேரம்.',
        'படிப்பு அல்லது வேலைக்கு முன்: கவனத்தை நிலைப்படுத்த சில நிமிடங்கள் ஞான முத்திரை.',
        'உணவுக்குப் பின்: அபான முத்திரை பாரம்பரியமாக உணவுக்குப் பின் செய்யப்படுகிறது. மற்றவற்றுக்கு, பெரிய உணவுக்குப் பின் சுமார் 30 நிமிடம் காத்திருங்கள்.',
        'மாலையில்: ஞான முத்திரையுடன் அமைதியாகுங்கள். பிராண முத்திரை உற்சாகம் தந்தால், அதை நாளின் முற்பகுதியில் செய்யுங்கள்.',
        'தேவைப்படும்போது: அமைதியின்மை அல்லது தலைக்கனம் உணரும்போது வாயு அல்லது சூன்ய முத்திரையைச் சிறு அமர்வுகளாக, இலகுவாக உணரும் வரை மட்டும் செய்யுங்கள்.',
      ],
    },
    {
      title: 'எவ்வளவு நேரம்',
      items: [
        '3 முதல் 5 நிமிடங்களில் தொடங்கி, படிப்படியாக 10 அல்லது 15 நிமிடங்களுக்கு உயர்த்துங்கள்.',
        'நாளில் பல சிறு அமர்வுகள், ஒரு நீண்ட அமர்வுக்குச் சமமானவை.',
        '1 முதல் 60 நிமிடங்கள் வரை எந்த நேரத்துக்கும் தனிப்பயன் டைமரை (− / +) பயன்படுத்துங்கள்.',
      ],
    },
  ],
};

export const WIKI: Record<Lang, Record<MudraId, WikiEntry>> = {
  en: {
    gyan: {
      overview:
        'One of the most widely known mudras, often seen in images of meditation. Gyan means knowledge or wisdom.',
      elements:
        'Joins air (index finger) with fire (thumb). Traditionally this is said to balance the air element, which is linked with the restless movement of the mind.',
      bestTime: 'Morning, before study, or any time you want to settle.',
      duration: '10 to 15 minutes. It can be held longer once it feels comfortable.',
      tips: 'Chin mudra is the same gesture with the palms facing down, considered more grounding.',
    },
    prana: {
      overview: 'Prana means life force. This mudra is traditionally practiced to awaken a sense of vitality.',
      elements:
        'Joins earth (ring finger) and water (little finger) with fire (thumb), traditionally said to build steadiness and stamina.',
      bestTime: 'Morning, or mid-afternoon when energy dips.',
      duration: '10 to 15 minutes.',
      tips: 'Pairs well with slow, even breathing. Try it seated near a window in daylight.',
    },
    apana: {
      overview:
        'Apana is the downward-moving energy in yogic tradition, linked with digestion, elimination and letting go.',
      elements: 'Joins space (middle finger) and earth (ring finger) with fire (thumb).',
      bestTime: 'After meals, or in the evening.',
      duration: '5 to 15 minutes.',
      tips: 'Keep the belly soft and let the breath move down into the abdomen.',
    },
    vayu: {
      overview:
        'Vayu means air. The air finger folds under the thumb, which traditionally calms an excess of air: restlessness and an unsettled feeling.',
      elements: 'Reduces air (index finger folded under the thumb).',
      bestTime: 'When you feel restless or unsettled.',
      duration: '5 to 10 minutes. Stop once you feel at ease; it is not meant for long daily use.',
      tips: 'Press with the thumb gently. There should be no strain on the folded finger.',
    },
    shunya: {
      overview:
        'Shunya means emptiness or space. It is traditionally associated with the ears and a sense of openness in the head.',
      elements: 'Reduces space (middle finger folded under the thumb).',
      bestTime: 'When the head feels heavy or full, or in a quiet moment.',
      duration: '5 to 10 minutes. Stop once you feel at ease.',
      tips: 'Sit somewhere quiet and notice the sounds around you without following them.',
    },
  },
  ta: {
    gyan: {
      overview: 'தியானப் படங்களில் அடிக்கடி காணப்படும், மிகவும் அறியப்பட்ட முத்திரைகளில் ஒன்று. ஞானம் என்றால் அறிவு அல்லது விவேகம்.',
      elements:
        'காற்றை (ஆள்காட்டி விரல்) நெருப்புடன் (கட்டைவிரல்) இணைக்கிறது. மனதின் அலைச்சலுடன் தொடர்புடைய காற்று பூதத்தை இது சமநிலைப்படுத்துவதாகப் பாரம்பரியமாகக் கூறப்படுகிறது.',
      bestTime: 'காலையில், படிப்புக்கு முன், அல்லது அமைதி தேவைப்படும் எந்த நேரத்திலும்.',
      duration: '10 முதல் 15 நிமிடங்கள். பழகிய பின் நீண்ட நேரம் செய்யலாம்.',
      tips: 'உள்ளங்கைகள் கீழ்நோக்கி இருக்கும் அதே முத்திரை சின் முத்திரை எனப்படும்; இது மேலும் நிலைப்படுத்துவதாகக் கருதப்படுகிறது.',
    },
    prana: {
      overview: 'பிராணம் என்றால் உயிர்சக்தி. உயிர்ப்புணர்வைத் தூண்ட இந்த முத்திரை பாரம்பரியமாகப் பயிற்சி செய்யப்படுகிறது.',
      elements:
        'நிலம் (மோதிர விரல்) மற்றும் நீர் (சுண்டு விரல்) ஆகியவற்றை நெருப்புடன் (கட்டைவிரல்) இணைக்கிறது; நிலைத்தன்மையையும் தாங்குதிறனையும் வளர்ப்பதாகப் பாரம்பரியமாகக் கூறப்படுகிறது.',
      bestTime: 'காலையில், அல்லது ஆற்றல் குறையும் மதிய நேரத்தில்.',
      duration: '10 முதல் 15 நிமிடங்கள்.',
      tips: 'மெதுவான, சீரான மூச்சுடன் நன்றாகப் பொருந்தும். பகல் வெளிச்சத்தில் சன்னல் அருகே அமர்ந்து முயற்சி செய்யுங்கள்.',
    },
    apana: {
      overview: 'யோக மரபில் அபானம் என்பது கீழ்நோக்கி நகரும் சக்தி; செரிமானம், வெளியேற்றம் மற்றும் விடுவித்தலுடன் தொடர்புடையது.',
      elements: 'ஆகாயம் (நடு விரல்) மற்றும் நிலம் (மோதிர விரல்) ஆகியவற்றை நெருப்புடன் (கட்டைவிரல்) இணைக்கிறது.',
      bestTime: 'உணவுக்குப் பின், அல்லது மாலையில்.',
      duration: '5 முதல் 15 நிமிடங்கள்.',
      tips: 'வயிற்றைத் தளர்வாக வைத்து, மூச்சு அடிவயிறு வரை இறங்கட்டும்.',
    },
    vayu: {
      overview:
        'வாயு என்றால் காற்று. காற்று விரல் கட்டைவிரலின் கீழ் மடக்கப்படுகிறது; இது அதிகப்படியான காற்றை, அதாவது அமைதியின்மையையும் நிலையற்ற உணர்வையும், தணிப்பதாகப் பாரம்பரியமாகக் கூறப்படுகிறது.',
      elements: 'காற்றைக் குறைக்கிறது (ஆள்காட்டி விரல் கட்டைவிரலின் கீழ் மடக்கப்பட்டுள்ளது).',
      bestTime: 'அமைதியின்மை அல்லது நிலையற்ற உணர்வு இருக்கும்போது.',
      duration: '5 முதல் 10 நிமிடங்கள். இலகுவாக உணர்ந்ததும் நிறுத்துங்கள்; தினமும் நீண்ட நேரம் செய்வதற்கானது அல்ல.',
      tips: 'கட்டைவிரலால் மென்மையாக அழுத்துங்கள். மடக்கிய விரலில் சிரமம் இருக்கக் கூடாது.',
    },
    shunya: {
      overview: 'சூன்யம் என்றால் வெறுமை அல்லது ஆகாயம். இது பாரம்பரியமாகக் காதுகளுடனும் தலையில் விசாலமான உணர்வுடனும் தொடர்புடையது.',
      elements: 'ஆகாயத்தைக் குறைக்கிறது (நடு விரல் கட்டைவிரலின் கீழ் மடக்கப்பட்டுள்ளது).',
      bestTime: 'தலை கனமாக அல்லது நிறைந்ததாக உணரும்போது, அல்லது அமைதியான நேரத்தில்.',
      duration: '5 முதல் 10 நிமிடங்கள். இலகுவாக உணர்ந்ததும் நிறுத்துங்கள்.',
      tips: 'அமைதியான இடத்தில் அமர்ந்து, சுற்றியுள்ள ஒலிகளைப் பின்தொடராமல் கவனியுங்கள்.',
    },
  },
};
