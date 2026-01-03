package weTube.ui;

import org.springframework.stereotype.Controller;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.servlet.ModelAndView;

@Controller
public class CursorModeController {

    @GetMapping("/cursor-mode")
    public ModelAndView showCursorModePage() {
        return new ModelAndView("CursorMode");
    }
}