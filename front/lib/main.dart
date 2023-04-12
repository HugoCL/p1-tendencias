import 'dart:async';
import 'dart:convert';

import 'package:flutter/material.dart';
import 'package:socket_io_client/socket_io_client.dart' as IO;
import 'package:socket_io_client/socket_io_client.dart';
import 'package:syncfusion_flutter_gauges/gauges.dart';

void main() {
  runApp(const MyApp());
}

class StreamSocket {
  final _socketResponse = StreamController<String>();

  void Function(String) get addResponse => _socketResponse.sink.add;

  Stream<String> get getResponse => _socketResponse.stream;

  void dispose() {
    _socketResponse.close();
  }
}

class MyApp extends StatelessWidget {
  const MyApp({super.key});

  // This widget is the root of your application.
  @override
  Widget build(BuildContext context) {
    return MaterialApp(
      title: 'Flutter Demo',
      theme: ThemeData(
        primarySwatch: Colors.blue,
        useMaterial3: true,
      ),
      home: const MyHomePage(
          title: 'Proyecto 1 - Tendencias en Tecnologías Computacionales'),
    );
  }
}

class MyHomePage extends StatefulWidget {
  const MyHomePage({super.key, required this.title});
  final String title;

  @override
  State<MyHomePage> createState() => _MyHomePageState();
}

class _MyHomePageState extends State<MyHomePage> {
  StreamSocket streamSocket = StreamSocket();
  double temperature = 0;
  double humidity = 0;
  DateTime timestamp = DateTime.now();
  void connect() {
    IO.Socket socket = IO.io('https://ws-p1-tendencias-with.hugocastro.dev',
        OptionBuilder().setTransports(['websocket']).build());
    socket.onConnect((_) {
      print('Conectado!');
      socket.emit('get-stream-data', '');
    });
    socket.on('stream-data', (data) {
      if (data['unit'] == 'C') {
        setState(() {
          temperature = data['data'];
          timestamp = DateTime.parse(data['timestamp']).toLocal();
        });
      } else if (data['unit'] == '%') {
        setState(() {
          humidity = data['data'];
          timestamp = DateTime.parse(data['timestamp']).toLocal();
        });
      }
    });
  }

  @override
  void initState() {
    connect();
    super.initState();
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: Text(widget.title),
      ),
      body: Center(
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: <Widget>[
            Row(
              children: [
                Expanded(
                  child: SfRadialGauge(
                    enableLoadingAnimation: true,
                    axes: [
                      RadialAxis(
                        minimum: 0,
                        maximum: 50,
                        ranges: [
                          GaugeRange(
                              startValue: 0, endValue: 26, color: Colors.green),
                          GaugeRange(
                              startValue: 26, endValue: 50, color: Colors.red),
                        ],
                        pointers: [
                          NeedlePointer(
                            value: temperature,
                            enableAnimation: true,
                          ),
                        ],
                        annotations: [
                          GaugeAnnotation(
                              widget: Container(
                                  child: Text(
                                      '${temperature.toStringAsFixed(2)} °C',
                                      style: TextStyle(
                                        fontSize: 20,
                                      ))),
                              angle: 90,
                              positionFactor: 0.5)
                        ],
                      ),
                    ],
                  ),
                ),
                Expanded(
                  child: SfRadialGauge(
                    enableLoadingAnimation: true,
                    axes: [
                      RadialAxis(
                        minimum: 0,
                        maximum: 100,
                        ranges: [
                          GaugeRange(
                              startValue: 0, endValue: 60, color: Colors.green),
                          GaugeRange(
                              startValue: 60, endValue: 100, color: Colors.red),
                        ],
                        pointers: [
                          NeedlePointer(
                            value: humidity,
                            enableAnimation: true,
                          ),
                        ],
                        annotations: [
                          GaugeAnnotation(
                              widget: Container(
                                  child:
                                      Text('${humidity.toStringAsFixed(2)} %',
                                          style: TextStyle(
                                            fontSize: 20,
                                          ))),
                              angle: 90,
                              positionFactor: 0.5)
                        ],
                      ),
                    ],
                  ),
                ),
              ],
            ),
            Center(
              child: Text(
                'Última actualización: ${timestamp.toString()}',
                style: TextStyle(fontSize: 20, fontWeight: FontWeight.bold),
              ),
            )
          ],
        ),
      ),
    );
  }
}
