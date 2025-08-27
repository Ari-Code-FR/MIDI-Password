// Characters in passwords
const alphabet = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*()_-+=<>?"


let midi = null;
let notes = [];
let lastTimeCheck = 0;

// Request midi input
navigator.requestMIDIAccess().then(onMIDISuccess, onMIDIFailure);

function onMIDISuccess(midiAccess) {
  console.log("MIDI ready!");
  midi = midiAccess;
  // Detect midi input
  startLoggingMIDIInput(midi)

  // Detect when password ends
  setInterval(checkIfPasswordEnded, 200)
}

function onMIDIFailure(msg) {
  console.warn(`Failed to get MIDI access - Accept midi browser authorisations. ERROR :  ${msg}`);
}

function startLoggingMIDIInput(midiAccess) {
  midiAccess.inputs.forEach((entry) => {
    entry.onmidimessage = onMIDIMessage;
  });
}

function onMIDIMessage(event) {
  const [status, note, velocity] = event.data;
  console.log(status)
  const command = status & 0xf0;

  if (command === 0x90 && velocity > 0) {
    notes.push(note);
  }
  lastTimeCheck = Date.now();
}

async function checkIfPasswordEnded() {
  // When users hasn't played a note since 3 sec, type the password
  if (lastTimeCheck == 0) {
    return;
  }
  if (Date.now() - lastTimeCheck < 3000) {
    return;
  }
  lastTimeCheck = 0
  hashedArray = await hashPw(new Uint8Array(notes))

  password = convertHashToAlphabet(hashedArray)

  const active = document.activeElement;
  if (active && (active.tagName === "INPUT" || active.tagName === "TEXTAREA")) {
    // Type and trigger events
    for (const char of password) {
      active.value += char;

      active.dispatchEvent(new KeyboardEvent("keydown", { key: char }));
      active.dispatchEvent(new KeyboardEvent("keypress", { key: char }));
      active.dispatchEvent(new KeyboardEvent("keyup", { key: char }));

      active.dispatchEvent(new Event("input", { bubbles: true }));
    }
  }
  // Reset
  notes = []
  lastTimeCheck = 0
}

async function hashPw(password) {
  const hashBuffer = await crypto.subtle.digest('SHA-512', password);

  const hashArray = Array.from(new Uint8Array(hashBuffer));

  return hashArray;
}

function convertHashToAlphabet(hashArray) {
  let password = "";
  // SHA 512 : 64 bytes
  // PW lenght : 16 chars
  // So 1 char = 4 bytes

  for (let i = 0; i < hashArray.length; i += 4) {
    let block = hashArray.slice(i, i +4); 
    let num = block[0] * 2**24 + block[1] * 2**16 + block[2] * 2**8 + block[3]
    let char = alphabet[num % alphabet.length];
    password += char
  }
  return password
}
