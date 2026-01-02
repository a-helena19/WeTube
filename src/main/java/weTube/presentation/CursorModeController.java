package weTube.presentation;

import org.springframework.stereotype.Controller;
import org.springframework.web.bind.annotation.GetMapping;

@Controller
public class CursorModeController {
    @GetMapping("/cursor-test")
    public String showCursorModeTest() {
        return "test";
    }


    @GetMapping("/test")
    public String showTest() {
        return "test";
    }
}