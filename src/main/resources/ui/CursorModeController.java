package com.wetube.controller;

import org.springframework.stereotype.Controller;
import org.springframework.web.bind.annotation.GetMapping;

@Controller
public class CursorModeController {

    @GetMapping("/cursor-mode")
    public String showCursorModePage() {
        return "CursorMode";
    }
}