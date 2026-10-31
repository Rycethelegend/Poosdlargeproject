import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:poosdalatro/routes/routes.dart';

Future<void> main() async{
  runApp(const MyApp());
}

class MyApp extends StatelessWidget {
  const MyApp({super.key});

  @override
  Widget build(BuildContext context) {
    return MaterialApp(
      title: 'Poosdalatro',
      debugShowCheckedModeBanner: false,
      theme: ThemeData(colorSchemeSeed: Colors.indigo),
      routes: Routes.getRoutes,
    );
  }
}