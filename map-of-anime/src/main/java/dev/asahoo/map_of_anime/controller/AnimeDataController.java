package dev.asahoo.map_of_anime.controller;

import org.springframework.graphql.data.method.annotation.QueryMapping;
import org.springframework.stereotype.Controller;

@Controller
public class AnimeDataController {

  @QueryMapping
  public String helloWorld() {
    return "Hello World";
  }
}
