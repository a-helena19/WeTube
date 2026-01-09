package weTube.ui;

import org.springframework.stereotype.Controller;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.servlet.ModelAndView;

@Controller
public class TestPageController {
    @GetMapping("/testpage")
    public ModelAndView getTestTemplate() {
        return new ModelAndView("test");
    }
}
