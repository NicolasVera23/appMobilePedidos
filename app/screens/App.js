import React, { useState, useEffect } from 'react';
import {View, Text, StyleSheet, Image, TouchableOpacity, ScrollView} from 'react-native';
import Modal from 'react-native-modal';
import {openDatabase} from '../data/db';

const App=({navigation, route})=>{
  const [pagoConfirmado, setPagoConfirmado] = useState(false);

  const [setIndexToDelete, setSetIndexToDelete] = useState(null);

  const [isPagoModalVisible, setPagoModalVisible] = useState(false);
  const [seleccionarPagoOpcion, setSeleccionarPagoOpcion] = useState(null);

  const [expandedEntregas, setExpandedEntregas] = useState([]);

  const [entregasCliBorrar, setEntregasCliBorrar] = useState([]);

  const [productosPorCliente, setProductosPorCliente] = useState({});

  const [nextId, setNextId] = useState(1); 
  //EXPANDIR O NO EL MODAL DEL MENU
  const [isModalVisible, setModalVisible] = useState(false);
  const db = openDatabase();

  const toggleModal = () => {
    setModalVisible(!isModalVisible);
  };
  console.log(isModalVisible)
  const getMaxId = (tx) => {
    return new Promise((resolve, reject) => {
      tx.executeSql(
        'SELECT MAX(id) AS maxId FROM ventas',
        [],
        (_, { rows }) => {
          const maxId = rows.item(0).maxId || 0;
          resolve(maxId);
        },
        (_, error) => {
          reject(error);
        }
      );
    });
  };
  //FILTRO
  const vendedor = route.params?.vendedor || "000";
  function filtrarClientes() {
    db.transaction((tx) => {
      tx.executeSql(
        'SELECT * FROM Clientes WHERE vendedor = ?',
        [vendedor],
        (_, { rows }) => {
          const entregas = rows._array;
          const productosPorCliente = {};
  
          tx.executeSql(
            'SELECT * FROM productApp',
            [],
            (_, { rows }) => {
              const productos = rows._array; 
  
              entregas.forEach((cliente) => {
                const { productosAleatorios, precioTotal } = obtenerProductosAleatorios(productos);
                productosPorCliente[cliente.id] = { productosAleatorios, precioTotal };
              });
              setEntregasCliBorrar(entregas);
              setProductosPorCliente(productosPorCliente);
            },
            (_, error) => {
              console.error("Error al obtener productos de la base de datos", error.message);
            }
          );
        },
        (_, error) => {
          console.error("Error al filtrar entregas", error.message);
        }
      );
    });
  }
  
  // Expandir o no las tarjetas
  const toggleCardEntregas = (index) => {
    const updatedExpandedEntregas = [...expandedEntregas];
    updatedExpandedEntregas[index] = !updatedExpandedEntregas[index];
    setExpandedEntregas(updatedExpandedEntregas);
  }
    
  const obtenerProductosAleatorios = (productos) => {
    const productosAleatorios = [];
    let productosDisponibles = [...productos];
    let precioTotal = 0;
  
    while (productosAleatorios.length < 5 && productosDisponibles.length > 0) {
      const indiceAleatorio = Math.floor(Math.random() * productosDisponibles.length);
      const productoAleatorio = productosDisponibles.splice(indiceAleatorio, 1)[0];

      const stockAleatorio = Math.floor(Math.random() * (productoAleatorio.stock + 1));
      productosAleatorios.push({...productoAleatorio,stockAleatorio});
  
      precioTotal += productoAleatorio.precio * stockAleatorio;
    }
    return { productosAleatorios, precioTotal };
  };
    useEffect(() => {
      db.transaction(async (tx) => {
        try {
          const maxId = await getMaxId(tx);
          setNextId(maxId + 1);
        } catch (error) {
          console.error('Error al obtener el ID máximo de ventas:', error.message);
        }
      }, []);
  
      filtrarClientes();
    }, [vendedor]);

//Eliminar tarjetas, lo hago separado por los indices:
  const eliminarTarjetaEntrega = (i) => {
    const updatedClientes = [...entregasCliBorrar];
    updatedClientes.splice(i, 1);
    setEntregasCliBorrar(updatedClientes);
  };

  //Este lo que va a hacer es verificar si todos estan entregados
  const todosEntregados = entregasCliBorrar.length === 0;

  //Modal de pago
  const abrirModalPago = (index) => {
    setPagoModalVisible(true);
    setSeleccionarPagoOpcion(null);
    setSetIndexToDelete(index);
  };
  const manejoOpcionePago = (option) => {
    setSeleccionarPagoOpcion(option);
  };
  console.log(nextId)

  const confirmPayment = () => {
    if (seleccionarPagoOpcion === null) {
      console.log("Debes seleccionar una forma de pago antes de confirmar el pago.");
    } else {
      console.log("Pago confirmado:", seleccionarPagoOpcion);
      setPagoConfirmado(true);
      setPagoModalVisible(false);
      eliminarTarjetaEntrega(setIndexToDelete);
  
      const cliente = entregasCliBorrar[setIndexToDelete].nombre;
      const fecha = new Date().toISOString(); 
      const total = productosPorCliente[entregasCliBorrar[setIndexToDelete].id]?.precioTotal;
      const form_pago = seleccionarPagoOpcion;
      const vendedor = route.params?.vendedor || "000";
      db.transaction((tx) => {
        tx.executeSql(
          "INSERT INTO ventas (id, cliente, fecha, total, form_pago, vendedor) VALUES (?, ?, ?, ?, ?, ?)",
          [nextId, cliente, fecha, total, form_pago, vendedor],
          (_, { insertId }) => {
            console.log("Venta insertada con éxito. Nuevo ID: " + insertId);
            setNextId(nextId + 1); 
          },
          (_, error) => {
            console.error("Error al insertar venta: " + error.message);
          }
        );
      });
    }
  };
  const navigateToDataCliente = (cliente) => {
    navigation.navigate('Informacion', { cli: cliente });
  };
  useEffect(() => {
    const unsubscribe = navigation.addListener('focus', () => {
      setModalVisible(false);
    });
  
    return unsubscribe;
  }, [navigation]);
  return(
      <ScrollView>
      <View style={style.container}>
      <Modal
        isVisible={isPagoModalVisible}
        onBackdropPress={() => setPagoModalVisible(false)}
        backdropOpacity={0.7}
        animationIn="zoomIn"
        animationOut="zoomOut"
        animationInTiming={1000}
        animationOutTiming={1}
      >
        <View style={style.paymentOptionsContainer}>
          <Text style={style.paymentOptionsTitle}>Selecciona una forma de pago</Text>
          
          <TouchableOpacity
            style={[
              style.paymentOption,
              seleccionarPagoOpcion === 'Efectivo' ? style.seleccionarPagoOpcion : null
            ]}
            onPress={() => manejoOpcionePago('Efectivo')}
          >
            <Text style={style.paymentOptionText}>Efectivo</Text>
            <Image
                source={require('../assets/dinero-en-efectivo.png')}
                style={style.imgOptionPay}
            /> 
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              style.paymentOption,
              seleccionarPagoOpcion === 'Debito' ? style.seleccionarPagoOpcion : null
            ]}
            onPress={() => manejoOpcionePago('Debito')}
          >
            <Text style={style.paymentOptionText}>Debito</Text>
            <Image
                source={require('../assets/tarjeta-de-credito.png')}
                style={style.imgOptionPay}
            /> 
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              style.paymentOption,
              seleccionarPagoOpcion === 'Credito' ? style.seleccionarPagoOpcion : null
            ]}
            onPress={() => manejoOpcionePago('Credito')}
          >
            <Text style={style.paymentOptionText}>Credito</Text>
            <Image
                source={require('../assets/tarjetas-de-credito.png')}
                style={style.imgOptionPay}
            /> 
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              style.paymentOption,
              seleccionarPagoOpcion === 'Transferencia' ? style.seleccionarPagoOpcion : null
            ]}
            onPress={() => manejoOpcionePago('Transferencia')}
          >
            <Text style={style.paymentOptionText}>Transferencia</Text>
            <Image
                source={require('../assets/transferencia-de-dinero.png')}
                style={style.imgOptionPay}
            />  
          </TouchableOpacity>
          <TouchableOpacity
            style={style.confirmPaymentButton}
            onPress={() => {
                confirmPayment();
            }}
          >
            <Text style={style.confirmPaymentButtonText}>
              Confirmar Pago
            </Text>
          </TouchableOpacity>
        </View>

      </Modal>
        <TouchableOpacity style={style.buttonMenu} onPress={toggleModal}>
          <Image
            source={require("../assets/menu(1).png")}
            style={style.buttonMenuImg}
            
          />
        </TouchableOpacity>
        <View style={style.separadorLogoView}>
        <Image
          source={require("../assets/MS_bco.png")}
          style={style.Logo}
          
        /> 
        </View>
        <Modal 
          isVisible={isModalVisible} 
          style={style.modal} 
          onBackdropPress={toggleModal}
          animationIn="slideInLeft" 
          animationOut="slideOutLeft" 
          animationInTiming={600} // =
          animationOutTiming={600} // =
          backdropTransitionInTiming={600} // Duracion de entrada
          backdropTransitionOutTiming={600} //Duracion de salida
        >
          <View style={style.modalMenu}>
              <View style={style.menuUpLogo}>  
                <Image
                  source={require('../assets/MS_bco.png')}
                  style={style.menuLogo}
                />
              </View>
              <TouchableOpacity onPress={()=>navigation.navigate("Clientes", { vendedor: vendedor})} 
                style={style.optionBottom}>
                    <Image
                      source={require('../assets/cliente.png')}
                      style={style.imgOptionMenu}
                    />
                <Text style={style.optionText}>Clientes</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={() => navigation.navigate("Ventas", { vendedor: vendedor})} 
                style={style.optionBottom}>
                <Image
                  source={require('../assets/entrega-de-pedidos.png')}
                  style={style.imgOptionMenu}
                />                 
                <Text style={style.optionText}>Pedidos totales</Text>
              </TouchableOpacity>
              <TouchableOpacity 
                style={style.optionBottom}
                onPress={()=> navigation.navigate('Productos')}
                >
                <Image
                  source={require('../assets/carrito-de-supermercado.png')}
                  style={style.imgOptionMenu}
                />  
                <Text style={style.optionText}>Articulos</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={()=>navigation.navigate("Mapa",{vendedor:vendedor})} 
                style={style.optionBottom}
              >
                <Image
                  source={require('../assets/ubicacion.png')}
                  style={style.imgOptionMenu}
                />  
                <Text style={style.optionText}>Map</Text>
              </TouchableOpacity>
                <View style={style.ViewStyleFooter}>
                  <Text></Text>
                </View>

            </View>
        </Modal>
      </View>
      <View style={style.div1general}>
        <View style={style.TextTitle}>
          <Text style={style.div1pedidosText}>Entregas</Text>
        </View>
        <View style={style.tarjetasPedidosClientes}>
          {entregasCliBorrar.map((cliente, index) => (
            <TouchableOpacity
              style={style.cardsButton}
              onPress={() => {
                toggleCardEntregas(index, cliente);
              }}
              key={`${cliente.id}-${index}`}
            >
              <View style={style.cardHeader}>
                <View style={style.clientNameContainer}>
                  <Text style={style.cardTitle}>{cliente.nombre}</Text>
                </View>
                <View style={style.infoCliente}>
                  <TouchableOpacity onPress={() => navigateToDataCliente(cliente)}>
                    <Image source={require('../assets/info.png')} style={style.infoIcon} />
                  </TouchableOpacity>
                </View>
              </View>
              {expandedEntregas [index] && (
                <View style={style.expandedContent}>
                  <Text style={style.contenidoInfoCliente}>Información del pedido:</Text>
                  <Text style={style.contenidoInfoCliente}>
                    Dirección:{' '}
                    <Text
                      style={{ color: 'white', textDecorationLine: 'underline', fontWeight:'normal', fontSize:15 }}
                      onPress={() => handleLinkClick('https://maps.app.goo.gl/i8nKcZv5W4BoAtFD6')}
                    >
                      {cliente.direccion}
                    </Text>
                  </Text>
                  <Text style={style.contenidoInfoCliente}>
                  <Text style={style.contenidoInfoCliente}>Celular: </Text>
                    <Text
                         style={{ color: 'white', fontWeight:'normal',fontSize:15 }}
                      >
                        {cliente.telefono}
                    </Text>
                  </Text>
                  <View>
                    <Text style={style.contenidoInfoCliente}>Lista a entregar:</Text>
                    {productosPorCliente[cliente.id]?.productosAleatorios.map((producto) => (
                      <View key={producto.id}>
                        <Text style={{color:'white'}}>
                        · {producto.nombre} x {producto.stockAleatorio}
                        </Text>
                      </View>
                    ))}
                    <Text style={style.contenidoInfoCliente}>Precio total: ${productosPorCliente[cliente.id]?.precioTotal}</Text>
                  </View>
                  <View style={style.botonaccion}>
                    <TouchableOpacity
                        style={[
                          style.botonCancelar,
                          { backgroundColor: cliente.estado ? 'gray' : '#A2C579' },
                        ]}
                        onPress={() => abrirModalPago(index)}
                      >
                        <Text style={style.textEntregar}>Entregar</Text>
                        <Image source={require('../assets/orden(1).png')} />
                      </TouchableOpacity>
                  </View>
                </View>
              )}
            </TouchableOpacity>
          ))}
        </View>
        {todosEntregados && (
          <View style={style.viewPedidosCompletados}>
            <Image
                source={require('../assets/repartidora(1).png')}
                style={style.imgRepartoCompletado}
            />
            <Text style={style.todosEntregadosMessage}>Has entregado todos los pedidos!!</Text>
          </View>
         )}
      </View>
{/*      <View style={style.botonAddContainer}>
        <TouchableOpacity style={style.botonAdd}>
          <Text style={style.botonAddText}>Agregar Pedido</Text>
        </TouchableOpacity>
        </View>*/}
      </ScrollView>
  );
}

const style = StyleSheet.create ({
  container:{
    width: "100%",
    height:50,
    backgroundColor: "#0e485e",
    flex:1,
    flexDirection:'row',
    alignItems:'center',
    marginBottom:30,
  },
  separadorLogoView:{
    width:"100%",
    alignItems:'center',
    position:'absolute'
  },
  Logo:{
    height:35,
    width:200
  },
  buttonMenuImg:{
    height: 26,
    width:26
  },
  div1pedidosText:{
    color:"#0e485e",
    fontSize:25,
    marginBottom:10,
    fontFamily: 'OpenSans-Bold',
  },
  modal:{
    justifyContent: 'flex-start',
    margin: 0
  },
  modalMenu: {
    flex:1,
    alignContent: 'center',
    height:"100%",
    width:"60%",
    backgroundColor: '#F0F3F4'
  },
  imgOptionMenu:{
    width:34,
    height:34,
    marginRight:5
  },
  ViewStyleFooter:{
    height:"15%",
    justifyContent:'flex-end',
    marginTop:"125%",//mala practica es para ver
    backgroundColor:"#A2C579"
  },
  optionBottom:{
    width:"100%",
    height:65,
    borderBottomWidth:1,
    borderBottomColor: "#979A9A",
    justifyContent:'flex-start',
    alignItems:'center',
    flexDirection:'row'
  },
  optionText:{
    fontSize:23,
    justifyContent:'center',
    alignItems:'center'
  },
  tarjetasPedidosClientes: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardsButton: {
    width: "90%",
    padding: 20,
    backgroundColor: '#0e485e',
    borderRadius: 10,
    marginBottom:10,
    shadowColor:"#0e485e", 
    shadowOffset:{width: 0, height: 18},
    shadowOpacity: 0.25,
    shadowRadius:20.00, 
    elevation:24
  },
  cardTitle: {
    fontSize: 18,
    color: '#FDB335',
    fontFamily: 'OpenSans-SemiBold'
  },
  expandedContent: {
    marginTop: 10,
  },
  contenidoInfoCliente:{
    color:'white',
    fontWeight: 'bold',
    fontSize:16
  },
  botonaccion:{
    flexDirection:'row',
    width:"100%"
  },
  botonAgregar:{
    justifyContent:'center',
    flexDirection:'row',
    justifyContent:'flex-start',
    marginTop:15,
    borderWidth:1,
    backgroundColor:'#FDB335',
    borderColor:'#FDB335',
    borderRadius:5
  },
  botonCancelar:{
    justifyContent:'center',
    flexDirection:'row',
    justifyContent:'flex-end',
    marginTop:15,
    borderWidth:1,
    backgroundColor:'#A2C579',
    borderColor:'#A2C579',
    borderRadius:5,
    marginLeft:100//MALA PRACTICA RESOLVER DESPUES

  },
  textAgregar:{
    alignItems:'center',
    justifyContent:'center',
    alignContent:'center',
    marginRight:3,
    fontSize:20
  },
  textEntregar:{
    alignItems:'center',
    justifyContent:'center',
    alignContent:'center',
    marginRight:3,
    fontSize:20,
  },
  viewPedidosCompletados:{
    justifyContent:'center',
    alignItems:'center'
  },
  todosEntregadosMessage: {
    fontSize: 18,
    color: '#A2C579',
    textAlign: 'center',
    marginTop: 10,
    fontWeight: 'bold'
  },
  imgRepartoCompletado:{
    width:300,
    height:300
  },
  menuUpLogo:{
    backgroundColor:'#0e485e',
    width:'100%',
    height:'15%',
    justifyContent:'center'
  },
  menuLogo:{
    width:'100%',
    height:50
  },
  infoCliente:{
    flex:1,
    alignItems:'flex-end',
  },
  cardHeader:{
    flex:1,
    flexDirection: 'row',
  },
  TextTitle:{
    width:"100%",
    alignItems:'center',
    marginBottom:30,
    marginTop:30
  },
  todosCobradosMessage: {
    fontSize: 18,
    color: '#A2C579',
    textAlign: 'center',
    marginTop: 10,
    fontWeight: 'bold',
    marginBottom:30
  },
  botonAddContainer:{
    alignSelf:'center',
    marginBottom:50,
    marginTop:50,
    width:"90%",
    alignItems: 'center',
  },
   botonAdd:{
    width: "90%",
    padding: 20,
    borderWidth:4,
    borderColor: '#0e485e',
    borderRadius: 10,
    marginBottom:10
   },
   botonAddText:{
    textAlign:'center',
    color:'#0e485e',
    fontSize:18,
    fontFamily:'OpenSans-SemiBold'
   }, 
   optionText:{
    fontFamily:'OpenSans-Regular',
     fontSize:20,
     fontWeight:'normal'
   },
   paymentOptionsContainer: {
    backgroundColor: 'white',
    padding: 20,
    borderRadius: 10,
  },
  paymentOption: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 10,
    marginTop:10,
    width:'100%',
    height:70,
    backgroundColor: '#FDB335',
    borderRadius:10,
    
  },
  selectedPaymentOption: {
    backgroundColor: '#A2C579', 
  },
  paymentOptionText: {
    marginLeft: 10,
    fontSize: 18,
    color:'#0e485e',
    fontFamily: 'OpenSans-SemiBold'
  },
  confirmPaymentButton: {
    backgroundColor: '#0e485e',
    padding: 10,
    borderRadius: 10,
    alignItems: 'center',
    marginTop: 20,
  },
  confirmPaymentButtonText: {
    color: 'white',
    fontSize: 18,
  },
  paymentOptionsTitle:{
    fontSize: 23,
    width:'100%',
    height:69,
    color:'#FDB335',
    borderBottomWidth:2,
    borderBottomColor:'#0e485e',
    fontWeight: 'bold',
    fontFamily: 'OpenSans-SemiBold',
    textAlign:'center',
    textAlignVertical:'center',
    
  },
  seleccionarPagoOpcion: {
    shadowColor: '#0e485e', 
    shadowOffset: {
      width: 100,
      height: 42,
    },
    shadowOpacity: 0.8, 
    shadowRadius: 168,
    elevation: 24,        
    borderColor: '#0e485e',
    borderWidth: 1.5,
  },
  imgOptionPay:{
    width:25,
    height:25
  },
  clientNameContainer: {
    flex: 1,
    alignItems: 'flex-start'
  },
  infoCliente: {
    alignItems: 'flex-end'
  },
  infoIcon: {
    width: 30,
    height: 30
  }
})

export default App;