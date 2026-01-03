package com.wetube.controller;

import org.springframework.stereotype.Controller;
import org.springframework.web.bind.annotation.GetMapping;

@Controller
public class GestureModeController {

    @GetMapping("/gesture-mode")
    public String showGestureModePage() {
        return "GestureMode";
    }
}