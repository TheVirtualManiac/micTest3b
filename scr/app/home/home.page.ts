import { Component, OnInit } from '@angular/core';
import { TextToSpeech } from '@capacitor-community/text-to-speech';
import { SpeechRecognition } from '@capacitor-community/speech-recognition';

@Component({
  selector: 'app-home',
  templateUrl: 'home.page.html',
  styleUrls: ['home.page.scss'],
})
export class HomePage implements OnInit {
  question = 'What is your favorite color? Please choose an answer by saying one, two, three, or by clicking the buttons.';
  answers = ['Red', 'Blue', 'Green'];
  selectedAnswer: string | null = null;

  async ngOnInit() {
    // Check and request microphone permissions
    const permission = await SpeechRecognition.checkPermissions();
    if (permission.speechRecognition !== 'granted' || permission.microphone !== 'granted') {
      const result = await SpeechRecognition.requestPermissions();
      if (result.speechRecognition !== 'granted' || result.microphone !== 'granted') {
        console.error('Microphone or speech recognition permission denied');
        return;
      }
    }

    // Perform a simple microphone test
    try {
      await SpeechRecognition.start({ language: 'en-US', maxResults: 1, prompt: 'Say "test" to check your microphone' });
      console.log('Microphone test: Speech detected.');
    } catch (error) {
      console.error('Microphone test failed:', error);
      await this.speak('Microphone test failed. Please check your microphone and try again.');
      return;
    }

    // Speak the question
    await this.speak(this.question);

    // Pause for 2 seconds
    await new Promise(resolve => setTimeout(resolve, 2000));

    // Speak the answers
    await this.speak('Say one for Red, two for Blue, or three for Green.');

    // Start speech recognition after 3 seconds
    setTimeout(() => this.startRecognition(), 3000);
  }

  async speak(text: string) {
    await TextToSpeech.speak({
      text: text,
      lang: 'en-US',
      rate: 1.0,
    });
  }

  async startRecognition() {
    try {
      const result = await SpeechRecognition.start({
        language: 'en-US',
        maxResults: 1,
        matches: ['one', 'two', 'three', 'repeat'],
      });
      if (result.matches && result.matches.length > 0) {
        const command = result.matches[0].toLowerCase();
        if (command === 'repeat') {
          await this.speak(this.question);
          await new Promise(resolve => setTimeout(resolve, 2000));
          await this.speak('Say one for Red, two for Blue, or three for Green.');
          setTimeout(() => this.startRecognition(), 3000);
        } else if (['one', 'two', 'three'].includes(command)) {
          this.selectAnswer(command);
        }
      }
    } catch (error) {
      console.error('Speech recognition error', error);
      setTimeout(() => this.startRecognition(), 3000); // Retry after error
    }
  }

  selectAnswer(answer: string) {
    let index;
    if (answer === 'one') index = 0;
    else if (answer === 'two') index = 1;
    else if (answer === 'three') index = 2;
    this.selectedAnswer = this.answers[index];
    this.speak(`You selected ${this.selectedAnswer}. Great choice!`);
  }

  onAnswerClick(index: number) {
    this.selectedAnswer = this.answers[index];
    this.speak(`You selected ${this.selectedAnswer}. Great choice!`);
  }

  onRepeatClick() {
    this.speak(this.question);
    setTimeout(() => this.speak('Say one for Red, two for Blue, or three for Green.'), 2000);
    setTimeout(() => this.startRecognition(), 3000);
  }
}