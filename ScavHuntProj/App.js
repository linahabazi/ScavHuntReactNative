import React from 'react';
import { Text, View, TouchableOpacity, FlatList, Alert } from 'react-native';
import { Camera, Permissions, ImageManipulator } from 'expo';
// import BigButton from './components/BigButton';
import { Button, CheckBox } from 'react-native-elements';
import CountDown from 'react-native-countdown-component';


const Clarifai = require('clarifai');
const colors = ["red", "green","brown", "maroon", "yellow"];
const general = ["fruit", "pencil", "container", "glasses"];

const phrases = [{ phrase: "A type of food that has seeds in it", answer: "fruit" },
  { phrase: "Something that you write with", answer: "pencil" },
  { phrase: "Something that holds a liquid", answer: "container" },
  { phrase: "Something to wear on your face", answer: "glasses"}]


const timer = require('react-native-timer');

const clarifai = new Clarifai.App({
  apiKey: '5c6d047c73434bff9c11eef3ddd98890',
});
process.nextTick = setImmediate;
export default class App extends React.Component {
  state = {
    hasCameraPermission: null,
    color: [],
    general: [],
    hint: {
      phrase: "",
      answer: "",
    },
    found: false,
    score: 0,
    startTimer: false,
    counter: 0,
    hintColor: "white",
  };
  async componentWillMount() {
    const { status } = await Permissions.askAsync(Permissions.CAMERA);
    this.setState({ hasCameraPermission: status === 'granted' });
    Alert.alert(
      'How to Play',
      'You have 20 seconds to find the correct item.',
      [
        { text: 'Done', onPress: () => console.log('OK Pressed') },
      ],
      { cancelable: false }
    )
    Alert.alert(
      'How to Play',
      'Try to scan as many correct items as you can.',
      [
        { text: 'Next', onPress: () => console.log('OK Pressed') },
      ],
      { cancelable: false }
    )
  }
  generateHint = async () => {
    let phrasesRand = Math.floor(Math.random() * phrases.length);
    console.log(phrases[phrasesRand]);
    this.setState({ found: false, counter: 20, startTimer: true, hint: { phrase: phrases[phrasesRand].phrase, answer: phrases[phrasesRand].answer, }, hintColor: "white" });
  }
  showCounter =() =>{
    if (this.state.startTimer) {
      console.log("render counter");
      return (
        <CountDown
          until={this.state.counter}
          onFinish={() => {
            alert("Time's Up!");
            this.setState({ score: this.state.score - 1, startTimer: false, hintColor: "red" });
          }}
          size={20}
          timeToShow={['S']}
          style={{ digitBgColor: "white" }}
        />
      );
    } else {
      return null;
    }
  }

  capturePhoto = async () => {
    if (this.camera) {
      let photo = await this.camera.takePictureAsync();
      return photo.uri;
    }
  };
  resize = async photo => {
    let manipulatedImage = await ImageManipulator.manipulate(
      photo,
      [{ resize: { height: 300, width: 300 } }],
      { base64: true }
    );
    return manipulatedImage.base64;
  };
  generalPredict = async image => {
    let predictions = await clarifai.models.predict(
      Clarifai.GENERAL_MODEL,
      image
    );
    return predictions;
  };

  objectDetection = async () => {
    let photo = await this.capturePhoto();
    let resized = await this.resize(photo);
    let generalPrediction = await this.generalPredict(resized);
    var generalPred = generalPrediction.outputs[0].data.concepts;
    var generals = [];
    Object.keys(generalPred).forEach(function (key) {
      var temp = {};
      temp["name"] = generalPred[key].name;
      temp["value"] = generalPred[key].value;
      generals.push(temp);
    });
    console.log(generals);
    var correct = false;
    var itemCorrect = false; 
    console.log(this.state.hint);
    Array.prototype.forEach.call(generals, item => {
      console.log(item.name);
      if (item.name.includes(this.state.hint.answer)) {
        console.log("found item");
        correct = true;
        itemCorrect = true;
        this.setState({ found: true, score: this.state.score+ 1, startTimer: false, hintColor: "green" });
      }
    });
    if (!correct) { 
      this.setState({ hintColor: "red", score: this.state.score-1 });
    }
    this.setState({ color: colors, general: generals, });
  };

  render() {
    const { hasCameraPermission, color, general, hint, found, score, startTimer, hintColor } = this.state;
    if (hasCameraPermission === null) {
      return <View />;
    } else if (hasCameraPermission === false) {
      return <Text>No access to camera</Text>;
    } else {
      if (this.state.score>=6) { 
        Alert.alert(
          'Congrats!',
          'You have passed level 1.',
          [
            { text: 'OK', onPress: () => console.log('OK Pressed') },
          ],
          { cancelable: false }
        )
      }
      return (
        <View style={{ flex: 1 }}>
          <Camera
            ref={ref => {
              this.camera = ref;
            }}
            style={{ flex: 1 }}
            type={this.state.type}
          >
            <View
              style={{
                flex: 1,
                backgroundColor: 'transparent',
                flexDirection: 'column',
                justifyContent: 'flex-end'
              }}
            >
              <View style={{flex:1, flexDirection: "column", justifyContent: "center"}}>
                <View style={{flexDirection: "row", justifyContent: 'space-around' }}>
                  <View style={{ paddingTop: 30, paddingBottom: 10, alignItems: 'center' }}>
                    <Button
                      title="Look for a..."
                      color="white"
                      fontSize={25}
                      buttonStyle={{
                        backgroundColor: "#BA3B46",
                        width: 200,
                        height: 75,
                        borderRadius: 5,
                        shadowColor: 'rgba(0, 0, 0, 0.1)',
                        shadowOpacity: 0.8,
                      }}
                      containerViewStyle={{ marginLeft: 0, marginRight: 0 }}
                      raised
                      onPress={this.generateHint}
                      onPressOut={() => { this.setState({ startTimer: true, }) }}
                    />
                  </View>
                  <View style={{ paddingTop: 30, paddingBottom: 10, alignItems: 'center' }}>
                    <Button
                      title="Scan Item"
                      color="white"
                      fontSize={25}
                      buttonStyle={{
                        backgroundColor: "#61C9A8",
                        width: 200,
                        height: 75,
                        borderRadius: 5,
                        shadowColor: 'rgba(0, 0, 0, 0.1)',
                        shadowOpacity: 0.8,
                      }}
                      containerViewStyle={{ marginLeft: 0, marginRight: 0 }}
                      raised
                      onPress={this.objectDetection}
                    />
                  </View>
                </View>
                <Text style={{flex: 1,  paddingLeft: 15, color: hintColor, fontSize: 30, alignSelf: "center"}}>{hint.phrase}</Text>
              </View>
              {this.showCounter()}
              <View style={{ flexDirection: "row", justifyContent: "space-between" }}>
                <View>
                  <Text style={{ fontSize: 30, color: "white", padding: 10 }}>Score: {score}</Text>
                </View>
              </View>
            </View>
          </Camera>
        </View>
      );
    }
  }
}