package weTube.ui;

import org.springframework.stereotype.Controller;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.servlet.ModelAndView;

@Controller

public class HelenaController {
    @GetMapping("/helena")
    public ModelAndView getHelenaTemplate() {
        return new ModelAndView("helena");
    }
}