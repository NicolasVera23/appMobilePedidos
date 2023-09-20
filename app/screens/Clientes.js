import React from 'react'
import { StyleSheet, Text, View,StatusBar,Image, ScrollView } from 'react-native'
import {Colors} from '../../app/constants'
import { clientes } from '../data/clientes'
import { clienteByID } from '../helpers/clienteByID'
import clienteCard from '../helpers/clienteCard'


const Clientes = (id) => {
  const cli = clienteByID(id);
    
    return (
        <ScrollView style={{flex:1,flexDirection:'column',justifyContent:'center',alignItems:'center',backgroundColor:Colors.white}} >
            <StatusBar barStyle="light-content" hidden={false} backgroundColor="#465bd8" />
            
            {cli.map(cli => (
              clienteCard({...cli})
            ))}
            
        </ScrollView>
    )
}

export default Clientes