import { Text, View,StatusBar,ImageBackground } from 'react-native';
import Buttons from '../components/Buttons';
//import {viewprincstart} from '../constants/styles';


const Onboarding = ({navigation}) => {
    return (
        <View style={{flex:1,backgroundColor:'#fff'}} >
            <StatusBar barStyle="light-content" hidden={false} backgroundColor="#0e485e" />
            
            <View style={{flex:3,flexDirection:"column",backgroundColor:'#fff'}} >
                <ImageBackground source={require('../assets/Messenger-cuate.png')}
                style={{flex:1,width:'100%',backgroundColor:'#fff',alignSelf:'center'}}  />
            </View>

            <View style={{flex:2,backgroundColor:'#fff'}} >
                
                <View style={{flex:1,flexDirection:'column',justifyContent:'flex-start',alignItems:'center',backgroundColor:'#fff'}} >
                    <Text style={{fontFamily:'OpenSans-Bold',color:'#0e485e',fontSize:30, borderBottomWidth:1, borderBottomColor: '#999', width:'80%', textAlign:'center'}} >MultiSoft</Text>
                    <Text style={{maxWidth:'100%', fontFamily:'OpenSans-Medium',color:"#999",fontSize:14, textAlign:'center',paddingTop:10}} >Gestión de pedidos y entregas.</Text>
                </View>   

                <View style={{flex:1,flexDirection:'column',justifyContent:'flex-end',alignItems:'center'}} >
                    <Buttons btn_text={"Empezar"} onPress={()=>navigation.navigate("Login")} />
                </View>

            </View>
            
        </View>
    )
}

export default Onboarding;

