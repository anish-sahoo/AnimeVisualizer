package dev.asahoo.map_of_anime.controller;

import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
public class UIController {

  @GetMapping("/")
  public String index() {
    return "Hello World";
  }
}
