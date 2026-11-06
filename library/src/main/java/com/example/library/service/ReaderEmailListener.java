package com.example.library.service;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.stereotype.Component;
import org.springframework.transaction.event.TransactionalEventListener;

@Component
@ConditionalOnProperty(name = "app.mail.enabled", havingValue = "true")
public class ReaderEmailListener {
    private static final Logger log = LoggerFactory.getLogger(ReaderEmailListener.class);
    private final JavaMailSender sender;
    private final String from;

    public ReaderEmailListener(JavaMailSender sender, @Value("${spring.mail.username}") String from) {
        this.sender = sender;
        this.from = from;
    }

    @TransactionalEventListener
    public void sendAfterCommit(ReaderEmail email) {
        send(email);
    }

    void send(ReaderEmail email) {
        try {
            var message = new SimpleMailMessage();
            message.setFrom(from);
            message.setTo(email.recipient());
            message.setSubject(email.subject());
            message.setText(email.body());
            sender.send(message);
        } catch (RuntimeException exception) {
            // Keep addresses and SMTP details out of logs.
            log.warn("Reader email delivery failed: {}", exception.getClass().getSimpleName());
        }
    }
}
