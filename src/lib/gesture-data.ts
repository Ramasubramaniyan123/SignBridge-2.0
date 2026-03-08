export interface GestureInfo {
  id: string;
  label: string;
  category: "vowel" | "consonant" | "word";
  description: string;
  instructions: string[];
  image: string;
}

export const GESTURES: GestureInfo[] = [
  // === VOWELS ===
  {
    id: "a", label: "A", category: "vowel",
    description: "Vowel A in Indian Sign Language",
    instructions: ["Make a fist with your thumb resting on the side", "Keep your fingers curled tightly", "Hold your hand steady in front of you"],
    image: "/gestures/letter-b.png", // fallback since letter-a was blocked
  },
  {
    id: "e", label: "E", category: "vowel",
    description: "Vowel E in Indian Sign Language",
    instructions: ["Extend all fingers and bring them together", "Touch your thumb to the tips of your fingers", "Palm faces outward"],
    image: "/gestures/letter-e.png",
  },
  {
    id: "i", label: "I", category: "vowel",
    description: "Vowel I in Indian Sign Language",
    instructions: ["Make a fist and extend your pinky finger", "Keep all other fingers curled", "Hold your hand upright"],
    image: "/gestures/letter-j.png", // fallback
  },
  {
    id: "o", label: "O", category: "vowel",
    description: "Vowel O in Indian Sign Language",
    instructions: ["Form an 'O' shape with your fingers and thumb", "Keep a round opening visible", "Hold your hand in front of your chest"],
    image: "/gestures/letter-o.png",
  },
  {
    id: "u", label: "U", category: "vowel",
    description: "Vowel U in Indian Sign Language",
    instructions: ["Extend your index and middle fingers together", "Point them upward", "Keep remaining fingers curled with thumb across"],
    image: "/gestures/letter-u.png",
  },

  // === CONSONANTS ===
  {
    id: "b", label: "B", category: "consonant",
    description: "Letter B in Indian Sign Language",
    instructions: ["Hold your hand flat with fingers together pointing up", "Thumb tucked across palm", "Palm faces outward"],
    image: "/gestures/letter-b.png",
  },
  {
    id: "c", label: "C", category: "consonant",
    description: "Letter C in Indian Sign Language",
    instructions: ["Curve your hand into a C shape", "Fingers and thumb form a half circle", "Keep the opening facing sideways"],
    image: "/gestures/letter-c.png",
  },
  {
    id: "d", label: "D", category: "consonant",
    description: "Letter D in Indian Sign Language",
    instructions: ["Point index finger up", "Touch thumb to middle finger tip", "Other fingers curl inward"],
    image: "/gestures/letter-d.png",
  },
  {
    id: "f", label: "F", category: "consonant",
    description: "Letter F in Indian Sign Language",
    instructions: ["Index finger and thumb make a circle", "Three remaining fingers extend upward", "Palm faces outward"],
    image: "/gestures/letter-f.png",
  },
  {
    id: "g", label: "G", category: "consonant",
    description: "Letter G in Indian Sign Language",
    instructions: ["Index finger points sideways horizontally", "Thumb parallel above it", "Other fingers curled into palm"],
    image: "/gestures/letter-g.png",
  },
  {
    id: "h", label: "H", category: "consonant",
    description: "Letter H in Indian Sign Language",
    instructions: ["Extend index and middle fingers sideways", "Keep fingers horizontal", "Other fingers curled with thumb"],
    image: "/gestures/letter-g.png", // fallback
  },
  {
    id: "j", label: "J", category: "consonant",
    description: "Letter J in Indian Sign Language",
    instructions: ["Start with pinky extended (like I)", "Draw a J shape in the air", "Curl the pinky downward"],
    image: "/gestures/letter-j.png",
  },
  {
    id: "k", label: "K", category: "consonant",
    description: "Letter K in Indian Sign Language",
    instructions: ["Index and middle fingers form a V pointing up", "Thumb touches middle finger", "Other fingers curled"],
    image: "/gestures/letter-d.png", // fallback
  },
  {
    id: "l", label: "L", category: "consonant",
    description: "Letter L in Indian Sign Language",
    instructions: ["Index finger points up", "Thumb extends to the side", "Form an L shape", "Other fingers curled"],
    image: "/gestures/letter-g.png", // fallback
  },
  {
    id: "m", label: "M", category: "consonant",
    description: "Letter M in Indian Sign Language",
    instructions: ["Three fingers fold over thumb", "Thumb tucked under index, middle, and ring fingers", "Fingers point downward"],
    image: "/gestures/letter-m.png",
  },
  {
    id: "n", label: "N", category: "consonant",
    description: "Letter N in Indian Sign Language",
    instructions: ["Two fingers fold over thumb", "Thumb between middle and ring fingers", "Similar to M but with two fingers"],
    image: "/gestures/letter-m.png", // fallback
  },
  {
    id: "p", label: "P", category: "consonant",
    description: "Letter P in Indian Sign Language",
    instructions: ["Like K but wrist turned downward", "Index and middle finger point down", "Thumb extends between them"],
    image: "/gestures/letter-q.png", // fallback
  },
  {
    id: "q", label: "Q", category: "consonant",
    description: "Letter Q in Indian Sign Language",
    instructions: ["Index finger and thumb point downward", "Like G but wrist turned down", "Other fingers curled"],
    image: "/gestures/letter-q.png",
  },
  {
    id: "r", label: "R", category: "consonant",
    description: "Letter R in Indian Sign Language",
    instructions: ["Cross index and middle fingers", "Other fingers curled into palm", "Thumb holds ring and pinky"],
    image: "/gestures/letter-v.png", // fallback
  },
  {
    id: "s", label: "S", category: "consonant",
    description: "Letter S in Indian Sign Language",
    instructions: ["Make a closed fist", "Thumb wraps over curled fingers", "Palm faces outward"],
    image: "/gestures/letter-m.png", // fallback
  },
  {
    id: "t", label: "T", category: "consonant",
    description: "Letter T in Indian Sign Language",
    instructions: ["Make a fist", "Tuck thumb between index and middle fingers", "Thumb tip peeks out"],
    image: "/gestures/letter-m.png", // fallback
  },
  {
    id: "v", label: "V", category: "consonant",
    description: "Letter V in Indian Sign Language",
    instructions: ["Index and middle fingers spread in a V", "Like a peace sign", "Other fingers curled with thumb"],
    image: "/gestures/letter-v.png",
  },
  {
    id: "w", label: "W", category: "consonant",
    description: "Letter W in Indian Sign Language",
    instructions: ["Index, middle, and ring fingers spread apart", "Pinky and thumb touch together", "Three fingers point upward"],
    image: "/gestures/letter-w.png",
  },
  {
    id: "x", label: "X", category: "consonant",
    description: "Letter X in Indian Sign Language",
    instructions: ["Index finger hooked/bent at knuckle", "Like a hook shape", "Other fingers in a fist"],
    image: "/gestures/letter-x.png",
  },
  {
    id: "y", label: "Y", category: "consonant",
    description: "Letter Y in Indian Sign Language",
    instructions: ["Thumb and pinky extended outward", "Like a 'hang loose' sign", "Other fingers curled"],
    image: "/gestures/letter-y.png",
  },
  {
    id: "z", label: "Z", category: "consonant",
    description: "Letter Z in Indian Sign Language",
    instructions: ["Index finger extended", "Draw a Z shape in the air", "Other fingers in a fist"],
    image: "/gestures/letter-q.png", // fallback
  },

  // === WORDS ===
  {
    id: "hello", label: "Hello", category: "word",
    description: "Greeting gesture in ISL",
    instructions: ["Open your palm facing outward", "Wave your hand gently side to side", "Smile while making the gesture"],
    image: "/gestures/word-hello.png",
  },
  {
    id: "thankyou", label: "Thank You", category: "word",
    description: "Expression of gratitude in ISL",
    instructions: ["Touch your chin with your fingertips", "Move your hand forward and slightly down", "Like blowing a kiss of gratitude"],
    image: "/gestures/word-hello.png", // fallback
  },
  {
    id: "yes", label: "Yes", category: "word",
    description: "Affirmative gesture in ISL",
    instructions: ["Make a fist and nod it up and down", "Similar to a head nod", "Keep the motion small and controlled"],
    image: "/gestures/word-yes.png",
  },
  {
    id: "no", label: "No", category: "word",
    description: "Negative gesture in ISL",
    instructions: ["Extend index and middle fingers", "Snap them against thumb", "Like a pinching motion repeated"],
    image: "/gestures/word-no.png",
  },
  {
    id: "help", label: "Help", category: "word",
    description: "Request for assistance in ISL",
    instructions: ["Place your fist on your open palm", "Raise both hands together", "Move upward to indicate need for help"],
    image: "/gestures/word-yes.png", // fallback
  },
  {
    id: "goodbye", label: "Goodbye", category: "word",
    description: "Farewell gesture in ISL",
    instructions: ["Open your palm facing outward", "Wave your hand in a closing motion", "Fingers together, wave side to side"],
    image: "/gestures/word-goodbye.png",
  },
  {
    id: "sorry", label: "Sorry", category: "word",
    description: "Apology gesture in ISL",
    instructions: ["Make a fist with your dominant hand", "Place it on your chest", "Move in a circular motion"],
    image: "/gestures/word-please.png", // fallback
  },
  {
    id: "please", label: "Please", category: "word",
    description: "Polite request gesture in ISL",
    instructions: ["Place your open palm on your chest", "Move your hand in a circular motion", "Keep the movement gentle"],
    image: "/gestures/word-please.png",
  },
  {
    id: "iloveyou", label: "I Love You", category: "word",
    description: "Expression of love in ISL",
    instructions: ["Extend thumb, index finger, and pinky", "Keep middle and ring fingers curled", "Hold your hand upright"],
    image: "/gestures/letter-y.png", // fallback
  },
  {
    id: "friend", label: "Friend", category: "word",
    description: "Friend gesture in ISL",
    instructions: ["Hook your index fingers together", "One facing up, one facing down", "Then switch positions"],
    image: "/gestures/word-hello.png", // fallback
  },
  {
    id: "water", label: "Water", category: "word",
    description: "Water gesture in ISL",
    instructions: ["Make a W hand shape", "Tap your chin with your index finger", "Repeat the tapping motion"],
    image: "/gestures/word-water.png",
  },
  {
    id: "food", label: "Food", category: "word",
    description: "Food/Eat gesture in ISL",
    instructions: ["Bring pinched fingers to your mouth", "Like putting food in your mouth", "Repeat the motion"],
    image: "/gestures/word-please.png", // fallback
  },
  {
    id: "home", label: "Home", category: "word",
    description: "Home gesture in ISL",
    instructions: ["Bring pinched fingers to your cheek", "Move hand up to the side of your head", "Like resting your head on a pillow"],
    image: "/gestures/word-goodbye.png", // fallback
  },
  {
    id: "school", label: "School", category: "word",
    description: "School gesture in ISL",
    instructions: ["Clap your hands together twice", "Like a teacher getting attention", "Keep the motion controlled"],
    image: "/gestures/word-hello.png", // fallback
  },
  {
    id: "good", label: "Good", category: "word",
    description: "Good gesture in ISL",
    instructions: ["Touch your chin with fingertips", "Move your hand down to your other palm", "Land your hand flat on the palm"],
    image: "/gestures/word-yes.png", // fallback
  },
  {
    id: "bad", label: "Bad", category: "word",
    description: "Bad gesture in ISL",
    instructions: ["Touch your chin with fingertips", "Move your hand downward", "Flip your hand palm down"],
    image: "/gestures/word-no.png", // fallback
  },
];

export const GESTURE_LABELS = GESTURES.map((g) => g.label);

export interface DetectionRecord {
  id: string;
  label: string;
  confidence: number;
  timestamp: Date;
}

export function getGestureByLabel(label: string): GestureInfo | undefined {
  return GESTURES.find((g) => g.label === label);
}
