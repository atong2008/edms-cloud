/*
 *    Copyright (c) 2018-2026, lengleng All rights reserved.
 *
 * Redistribution and use in source and binary forms, with or without
 * modification, are permitted provided that the following conditions are met:
 *
 * Redistributions of source code must retain the above copyright notice,
 * this list of conditions and the following disclaimer.
 * Redistributions in binary form must reproduce the above copyright
 * notice, this list of conditions and the following disclaimer in the
 * documentation and/or other materials provided with the distribution.
 * Neither the name of the pig4cloud.com developer nor the names of its
 * contributors may be used to endorse or promote products derived from
 * this software without specific prior written permission.
 * Author: lengleng (wangiegie@gmail.com)
 */

package com.edmscloud.edms.codegen;

import com.edmscloud.edms.common.datasource.annotation.EnableDynamicDataSource;
import com.edmscloud.edms.common.feign.annotation.EnableEdmsFeignClients;
import com.edmscloud.edms.common.security.annotation.EnableEdmsResourceServer;
import com.edmscloud.edms.common.swagger.annotation.EnableOpenApi;
import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.cloud.client.discovery.EnableDiscoveryClient;

/**
 * @author lengleng
 * @date 2018/07/29 代码生成模块
 */
@EnableDynamicDataSource
@EnableEdmsFeignClients
@EnableOpenApi("gen")
@EnableDiscoveryClient
@EnableEdmsResourceServer
@SpringBootApplication
public class EdmsCodeGenApplication {

	public static void main(String[] args) {
		SpringApplication.run(EdmsCodeGenApplication.class, args);
	}

}
