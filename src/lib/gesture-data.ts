export interface GestureInfo {
  id: string;
  label: string;
  category: "vowel" | "word" | "alphabet";
  description: string;
  instructions: string[];
  emoji: string;
}

export const GESTURES: GestureInfo[] = [
  {
    id: "a",
    label: "A",
    category: "vowel",
    description: "Vowel A in Indian Sign Language",
    instructions: [
      "Make a fist with your thumb resting on the side",
      "Keep your fingers curled tightly",
      "Hold your hand steady in front of you",
    ],
    emoji: "🤛",
  },
  {
    id: "e",
    label: "E",
    category: "vowel",
    description: "Vowel E in Indian Sign Language",
    instructions: [
      "Extend all fingers and bring them together",
      "Touch your thumb to the tips of your fingers",
      "Palm faces outward",
    ],
    emoji: "🤏",
  },
  {
    id: "i",
    label: "I",
    category: "vowel",
    description: "Vowel I in Indian Sign Language",
    instructions: [
      "Make a fist and extend your pinky finger",
      "Keep all other fingers curled",
      "Hold your hand upright",
    ],
    emoji: "🤙",
  },
  {
    id: "o",
    label: "O",
    category: "vowel",
    description: "Vowel O in Indian Sign Language",
    instructions: [
      "Form an 'O' shape with your fingers and thumb",
      "Keep a round opening visible",
      "Hold your hand in front of your chest",
    ],
    emoji: "👌",
  },
  {
    id: "u",
    label: "U",
    category: "vowel",
    description: "Vowel U in Indian Sign Language",
    instructions: [
      "Extend your index and middle fingers together",
      "Point them upward",
      "Keep remaining fingers curled with thumb across",
    ],
    emoji: "✌️",
  },
  {
    id: "hello",
    label: "Hello",
    category: "word",
    description: "Greeting gesture in ISL",
    instructions: [
      "Open your palm facing outward",
      "Wave your hand gently side to side",
      "Smile while making the gesture",
    ],
    emoji: "👋",
  },
  {
    id: "thankyou",
    label: "Thank You",
    category: "word",
    description: "Expression of gratitude in ISL",
    instructions: [
      "Touch your chin with your fingertips",
      "Move your hand forward and slightly down",
      "Like blowing a kiss of gratitude",
    ],
    emoji: "🙏",
  },
  {
    id: "yes",
    label: "Yes",
    category: "word",
    description: "Affirmative gesture in ISL",
    instructions: [
      "Make a fist and nod it up and down",
      "Similar to a head nod",
      "Keep the motion small and controlled",
    ],
    emoji: "👍",
  },
  {
    id: "no",
    label: "No",
    category: "word",
    description: "Negative gesture in ISL",
    instructions: [
      "Extend index and middle fingers",
      "Snap them against thumb",
      "Like a pinching motion repeated",
    ],
    emoji: "👎",
  },
  {
    id: "help",
    label: "Help",
    category: "word",
    description: "Request for assistance in ISL",
    instructions: [
      "Place your fist on your open palm",
      "Raise both hands together",
      "Move upward to indicate need for help",
    ],
    emoji: "🆘",
  },
];

export const GESTURE_LABELS = GESTURES.map((g) => g.label);

export interface DetectionRecord {
  id: string;
  label: string;
  confidence: number;
  timestamp: Date;
}
