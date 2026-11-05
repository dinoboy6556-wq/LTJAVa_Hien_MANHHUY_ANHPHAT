package com.example.library.controller;
import org.springframework.stereotype.Controller;import org.springframework.beans.factory.annotation.Value;import org.springframework.web.bind.annotation.*;import jakarta.servlet.http.HttpServletRequest;import org.springframework.web.util.UriComponentsBuilder;
@Controller public class UserPageController {
 @Value("${app.frontend-url:http://localhost:3000}") private String frontend;
 @GetMapping({"/","/user","/user/**"}) public String redirect(HttpServletRequest request){
  String path=request.getRequestURI();String target=switch(path){case "/","/user","/user/"->"/";case "/user/login"->"/login";case "/user/register"->"/register";case "/user/profile"->"/account/profile";case "/user/borrowed"->"/account/loans";case "/user/history"->"/account/history";case "/user/favorites"->"/account/favorites";case "/user/cart"->"/cart";case "/user/library"->"/library";default->path.substring(5);};
  String query=request.getQueryString();return "redirect:"+frontend.replaceAll("/+$","")+target+(query==null?"":"?"+query);
 }
}
