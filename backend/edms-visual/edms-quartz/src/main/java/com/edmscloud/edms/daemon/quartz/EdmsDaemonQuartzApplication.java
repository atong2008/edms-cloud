package com.edmscloud.edms.daemon.quartz;

import com.edmscloud.edms.common.feign.annotation.EnableEdmsFeignClients;
import com.edmscloud.edms.common.security.annotation.EnableEdmsResourceServer;
import com.edmscloud.edms.common.swagger.annotation.EnableOpenApi;
import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.cloud.client.discovery.EnableDiscoveryClient;

/**
 * @author frwcloud
 * @date 2019/01/23 定时任务模块
 */
@EnableOpenApi("job")
@EnableEdmsFeignClients
@EnableEdmsResourceServer
@EnableDiscoveryClient
@SpringBootApplication
public class EdmsDaemonQuartzApplication {

	public static void main(String[] args) {
		SpringApplication.run(EdmsDaemonQuartzApplication.class, args);
	}

}
